import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchsService } from './matchs.service';
import { Logger } from '@nestjs/common';
import { MatchStatus } from './interfaces/match.interface';
import { GamesStateService } from '../games-state/games-state.service';
import { getActiveRoom } from '../libs/socket.utils';
import { Unit } from '../units/entities/unit.entity';
import { MapsService } from '../maps/maps.service';
import { AxialCoordinates } from 'honeycomb-grid';
import { CombatService } from '../combat/combat.service';
import { UnitsService } from '../units/units.service';
import { Match } from './entities/match.entity';

type ClientData = {
  name: string;
  leaderId: string;
};
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
    private readonly unitsService: UnitsService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    const player = {
      id: client.id,
      name: client.handshake.query.name as string,
      leaderId: client.handshake.query.leaderId as string,
    };

    const match = this.matchsService.findOrCreate(player);

    if (match) {
      this.logger.log(`Match found for player ${player.name}: ${match.id}`);
      client.join(match.id);

      if (match.status === MatchStatus.FULL) {
        this.startGame(match);

        await this.matchsService.startMatch(match.id);

        const playerState = this.matchsService.getPlayerMatchView(
          match.id,
          match.player.id,
        );
        const enemyState = this.matchsService.getPlayerMatchView(
          match.id,
          match.enemy.id,
        );

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

      const gameStateUpdatedGold =
        this.gameStateService.decreaseCurrentPlayerGold(gameState, unit.price);

      const leader = this.gameStateService.getCurrentPlayerLeader(gameState);

      if (!leader) {
        this.logger.error(`Leader not found for player ${match.player.id}`);
        return;
      }

      const grid = this.mapsService.populateMap(match.map, gameState.units);
      const position = this.mapsService.getEnablePositionAround(
        grid,
        leader.state.position,
      );
      const gameStateUpdatedUnit = this.gameStateService.addUnitToGameState(
        gameStateUpdatedGold,
        unit,
        position,
      );

      this.matchsService.setGameState(match.id, gameStateUpdatedUnit);

      this.logger.log(
        `Client ${client.id} bought unit in room ${room}:`,
        unit.id,
      );

      const playerState = this.matchsService.getPlayerMatchView(
        match.id,
        match.player.id,
      );
      const enemyState = this.matchsService.getPlayerMatchView(
        match.id,
        match.enemy.id,
      );

      this.server.to(match.player.id).emit('matchUpdate', playerState);
      this.server.to(match.enemy.id).emit('matchUpdate', enemyState);
    }
  }

  @SubscribeMessage('moveUnit')
  handleMoveUnit(
    client: Socket,
    data: { from: AxialCoordinates; to: AxialCoordinates },
  ) {
    const room = getActiveRoom(client);
    const match = this.matchsService.findMatch(room);

    if (match) {
      try {
        let gameState = this.matchsService.getGameState(match.id);
        const grid = this.mapsService.populateMap(match.map, gameState.units);
        const distance = this.mapsService.getDistanceToIfCanTravel(
          grid,
          data.from,
          data.to,
        )!;

        gameState = this.gameStateService.moveUnitFromTo(
          gameState,
          data.from,
          data.to,
          distance,
        );

        this.matchsService.setGameState(match.id, gameState);

        this.logger.log(`Move unit from: ${data.from}, to ${data.to}`);

        const playerState = this.matchsService.getPlayerMatchView(
          match.id,
          match.player.id,
        );
        const enemyState = this.matchsService.getPlayerMatchView(
          match.id,
          match.enemy.id,
        );

        this.server.to(match.player.id).emit('matchUpdate', playerState);
        this.server.to(match.enemy.id).emit('matchUpdate', enemyState);
      } catch (error) {
        this.logger.error(`Error moving unit: ${error.message}`, error);
        this.server.to(client.id).emit('error', error.message);
      }
    }
  }

  @SubscribeMessage('attackUnit')
  handleAttackUnit(
    client: Socket,
    data: { from: AxialCoordinates; to: AxialCoordinates },
  ) {
    const room = getActiveRoom(client);
    const match = this.matchsService.findMatch(room);

    if (match) {
      try {
        let gameState = this.matchsService.getGameState(match.id);
        const grid = this.mapsService.populateMap(match.map, gameState.units);
        const canAtack = this.mapsService.canAtack(grid, data.from, data.to)!;

        if (canAtack) {
          const attacker = this.gameStateService.getUnitFromGameState(
            gameState,
            data.from,
          );
          const defender = this.gameStateService.getUnitFromGameState(
            gameState,
            data.to,
          );

          if (this.combatService.canAttackUnit(attacker, defender)) {
            const combatResult = this.combatService.attackUnit(
              attacker,
              defender,
            );

            this.logger.log(`Combat result: ${combatResult}`);

            gameState = this.gameStateService.updateUnitInGameState(
              gameState,
              combatResult.attacker,
            );

            if (!combatResult.defender) {
              gameState = this.gameStateService.removeUnitFromGameState(
                gameState,
                data.to,
              );

              if (defender.unit.leader) {
                this.endGame(client);
              }
            } else {
              gameState = this.gameStateService.updateUnitInGameState(
                gameState,
                combatResult.defender,
              );
            }

            this.matchsService.setGameState(match.id, gameState);

            this.logger.log(
              `${attacker.unit.name} attacked ${defender.unit.name} with ${combatResult.damage} damage`,
            );

            const playerState = this.matchsService.getPlayerMatchView(
              match.id,
              match.player.id,
            );
            const enemyState = this.matchsService.getPlayerMatchView(
              match.id,
              match.enemy.id,
            );

            this.server
              .to([match.player.id, match.enemy.id])
              .emit('matchDamage', {
                defenderPosition: data.to,
                damage: combatResult.damage,
              });

            this.server.to(match.player.id).emit('matchUpdate', playerState);
            this.server.to(match.enemy.id).emit('matchUpdate', enemyState);
          }
        } else {
          this.server.to(client.id).emit('error', "Can't attack");
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
      gameState = this.gameStateService.resetCurrentPlayerUnitsTurn(gameState);

      this.matchsService.setGameState(match.id, gameState);
      this.matchsService.saveMatchHistory(match.id);

      this.logger.log(`New turn ${client.id}`);

      const playerState = this.matchsService.getPlayerMatchView(
        match.id,
        match.player.id,
      );
      const enemyState = this.matchsService.getPlayerMatchView(
        match.id,
        match.enemy.id,
      );

      this.server.to(match.player.id).emit('matchUpdate', playerState);
      this.server.to(match.enemy.id).emit('matchUpdate', enemyState);
    }
  }

  private startGame(match: Match) {
    const map = this.mapsService.create();
    this.matchsService.setMap(match.id, map);

    let gameState = this.gameStateService.createGameState(match);

    const playerLeader = this.unitsService.findOne(match.player.leaderId);
    gameState = this.gameStateService.addUnitToGameState(
      gameState,
      playerLeader,
      { q: -1, r: 5 },
      true,
    );

    gameState = this.gameStateService.toggleCurrentPlayer(gameState);

    const enemyLeader = this.unitsService.findOne(match.enemy.leaderId);
    gameState = this.gameStateService.addUnitToGameState(
      gameState,
      enemyLeader,
      { q: 16, r: 5 },
      true,
    );

    gameState = this.gameStateService.toggleCurrentPlayer(gameState);

    this.matchsService.setGameState(match.id, gameState);
  }

  private endGame(client: Socket) {
    const room = getActiveRoom(client);
    const match = this.matchsService.findMatch(room);

    if (match) {
      let gameState = this.matchsService.getGameState(match.id);

      this.server.to([match.player.id, match.enemy.id]).emit('endGame', {
        winner: gameState.currentPlayer,
        loser:
          gameState.currentPlayer === match.player.id
            ? match.player.id
            : match.enemy.id,
      });
    }
  }
}
