import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchsService } from './matchs.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { MatchStatus } from './interfaces/match.interface';
import { GamesStateService } from '../games-state/games-state.service';
import { getActiveRoom } from '../libs/socket.utils';
import { DemonKing, Konrad, Unit } from '../units/entities/unit.entity';
import { MapsService } from '../maps/maps.service';
import { AxialCoordinates } from 'honeycomb-grid';
import { CombatService } from '../combat/combat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'match',
})
export class MatchsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MatchsGateway.name);

  constructor(
    private readonly matchsService: MatchsService,
    private readonly gameStateService: GamesStateService,
    private readonly mapsService: MapsService,
    private readonly combatService: CombatService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    const player = {
      id: client.id,
      name: `Player ${client.id}`,
    }

    const match = this.matchsService.findOrCreate(player);

    if (match) {
      this.logger.log(`Match found for player ${player.id}: ${match.id}`);
      client.join(match.id);

      if (match.status === MatchStatus.FULL) {
        const map = this.mapsService.create();
        this.matchsService.setMap(match.id, map);

        let gameState = this.gameStateService.createGameState(match);
        gameState = this.gameStateService.addUnitToGameState(gameState, Konrad, { q: -1, r: 5 }, true);
        gameState = this.gameStateService.toggleCurrentPlayer(gameState);
        gameState = this.gameStateService.addUnitToGameState(gameState, DemonKing, { q: 16, r: 5 }, true);
        gameState = this.gameStateService.toggleCurrentPlayer(gameState);

        this.matchsService.setGameState(match.id, gameState);

        await this.matchsService.startMatch(match.id);

        const playerState = this.matchsService.getPlayerMatchView(match.id, match.player.id);
        const enemyState = this.matchsService.getPlayerMatchView(match.id, match.enemy.id);

        this.server.to(match.player.id).emit('matchStart', playerState);
        this.server.to(match.enemy.id).emit('matchStart', enemyState);
      }
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    try {
      const match = this.matchsService.cancelPlayerMatch(client.id);

      if (match) {
        this.server.in(match.id).disconnectSockets(true);  
        this.logger.log(`Match (${match.id}) cancelled due to disconnection`);
      }
    } catch (error) {
      this.logger.error(`Error handling disconnect: ${error.message}`); 
    }
  }
  
  @SubscribeMessage('buyUnit')
  handleBuyUnit(client: Socket, unit: Unit) {
    const room = getActiveRoom(client);
    const match = this.matchsService.findMatch(room);

    if (match) {
      const gameState = this.matchsService.getGameState(match.id);

      const gameStateUpdatedGold = this.gameStateService.decreaseCurrentPlayerGold(gameState, unit.price);

      const leader = this.gameStateService.getCurrentPlayerLeader(gameState);

      if (!leader) {
        this.logger.error(`Leader not found for player ${match.player.id}`);
        return;
      }

      const position = this.mapsService.getEnablePositionAroundLeader(match.map, gameState.units, leader.state.position);
      const gameStateUpdatedUnit = this.gameStateService.addUnitToGameState(gameStateUpdatedGold, unit, position);

      this.matchsService.setGameState(match.id, gameStateUpdatedUnit);
      
      this.logger.log(`Client ${client.id} bought unit in room ${room}:`, unit.id);

      const playerState = this.matchsService.getPlayerMatchView(match.id, match.player.id);
      const enemyState = this.matchsService.getPlayerMatchView(match.id, match.enemy.id);

      this.server.to(match.player.id).emit('matchUpdate', playerState);
      this.server.to(match.enemy.id).emit('matchUpdate', enemyState);
    }
  }
  
  @SubscribeMessage('moveUnit')
  handleMoveUnit(client: Socket, data: { from: AxialCoordinates; to: AxialCoordinates }) {
    const room = getActiveRoom(client);
    const match = this.matchsService.findMatch(room);

    if (match) {
      try {
        let gameState = this.matchsService.getGameState(match.id);
        const distance = this.mapsService.distanceToTravel(match.map, gameState.units, data.from, data.to)!;

        gameState = this.gameStateService.moveUnitFromTo(gameState, data.from, data.to, distance);

        this.matchsService.setGameState(match.id, gameState);

        this.logger.log(`Move unit from: ${data.from}, to ${data.to}`);

        const playerState = this.matchsService.getPlayerMatchView(match.id, match.player.id);
        const enemyState = this.matchsService.getPlayerMatchView(match.id, match.enemy.id);

        this.server.to(match.player.id).emit('matchUpdate', playerState);
        this.server.to(match.enemy.id).emit('matchUpdate', enemyState);
      } catch (error) {
        this.logger.error(`Error moving unit: ${error.message}`, error);
        this.server.to(client.id).emit('error', error.message);
      }
    }
  }

  @SubscribeMessage('attackUnit')
  handleAttackUnit(client: Socket, data: { from: AxialCoordinates; to: AxialCoordinates }) {
    const room = getActiveRoom(client);
    const match = this.matchsService.findMatch(room);

    if (match) {
      try {
        let gameState = this.matchsService.getGameState(match.id);
        const canAtack = this.mapsService.canAtack(match.map, gameState.units, data.from, data.to)!;
        
        if (canAtack) {
          const attacker = this.gameStateService.getUnitFromGameState(gameState, data.from);
          const defender = this.gameStateService.getUnitFromGameState(gameState, data.to);

          if (this.combatService.canAttack(attacker)) {
            const combatResult = this.combatService.attackUnit(attacker, defender);

            this.logger.log(`Combat result: ${combatResult}`);

            if (combatResult.isDead) {
              const attackerStateUpdated = this.combatService.gainExperience(attacker, defender);
              
              this.logger.log(`Unit ${attacker.unit.id} gained experience: ${attackerStateUpdated.state.experience}`);

              if (attackerStateUpdated.evolved) {
                gameState = this.gameStateService.updateUnitInGameState(gameState, attackerStateUpdated.unit);

                this.logger.log(`Unit ${attacker.unit.id} evolved to level ${attackerStateUpdated.unit.state.level}`);
              } else {
                gameState = this.gameStateService.updateUnitStateInGameState(gameState, data.from, attackerStateUpdated.state);
              }

              gameState = this.gameStateService.removeUnitFromGameState(gameState, data.to);
            } else {
              gameState = this.gameStateService.updateUnitStateInGameState(gameState, data.from, combatResult.attackerState);
              gameState = this.gameStateService.updateUnitStateInGameState(gameState, data.to, combatResult.defenderState);
            }

            this.matchsService.setGameState(match.id, gameState);

            this.logger.log(`Attack unit from: ${data.from}, to ${data.to}`);

            const playerState = this.matchsService.getPlayerMatchView(match.id, match.player.id);
            const enemyState = this.matchsService.getPlayerMatchView(match.id, match.enemy.id);

            this.server.to(match.player.id).emit('matchUpdate', playerState);
            this.server.to(match.enemy.id).emit('matchUpdate', enemyState);
          }
        } else {
          this.server.to(client.id).emit('error', 'Can\'t attack');
        }

      } catch (error) {
        this.logger.error(`Error moving unit: ${error.message}`, error);
        this.server.to(client.id).emit('error', error.message);
      }
    }
  }
  
  @SubscribeMessage('finishTurn')
  handleFinishTurn(client: Socket) {
    const room = getActiveRoom(client);
    const match = this.matchsService.findMatch(room);

    if (match) {
      let gameState = this.matchsService.getGameState(match.id);
      gameState = this.gameStateService.toggleCurrentPlayer(gameState);
      gameState = this.gameStateService.increaseCurrentPlayerGold(gameState);
      gameState = this.gameStateService.resetCurrentPlayerUnitsDistance(gameState);

      this.matchsService.setGameState(match.id, gameState);
      this.matchsService.saveMatchHistory(match.id);
      
      this.logger.log(`New turn ${client.id}`);

      const playerState = this.matchsService.getPlayerMatchView(match.id, match.player.id);
      const enemyState = this.matchsService.getPlayerMatchView(match.id, match.enemy.id);

      this.server.to(match.player.id).emit('matchUpdate', playerState);
      this.server.to(match.enemy.id).emit('matchUpdate', enemyState);
    }
  }
}
