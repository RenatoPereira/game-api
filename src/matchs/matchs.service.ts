import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Match } from './entities/match.entity';
import { Player } from '../players/entities/player.entity';
import { MatchStatus } from './interfaces/match.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameState } from '../games-state/entities/game-state.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MatchsService {
  private matchs: Map<string, Match> = new Map();
  private openedMatchs: Map<string, Match> = new Map();

  private readonly logger = new Logger(MatchsService.name);

  constructor(
    @InjectRepository(Match) private matchRepository: Repository<Match>,
  ) {}

  findOrCreate(player: Player): Match {
    const openedMatch = this.findOpenedMatch();

    if (openedMatch) {
      this.addPlayer(player, openedMatch);
      this.moveMatch(openedMatch);

      return openedMatch;
    }

    return this.create(player);
  }

  private findOpenedMatch(): Match | null {
    const match = Array.from(this.openedMatchs.values()).find(
      (m) => m.status === MatchStatus.CREATED,
    );

    if (!match) return null;

    match.status = MatchStatus.WAITING;

    return match;
  }

  findMatch(matchId: string): Match | undefined {
    const match = this.matchs.get(matchId);

    if (!match) {
      this.logger.log(`Match (${matchId}) not found`);
      throw new NotFoundException(`Match (${matchId}) not found`);
    }

    return match;
  }

  private addPlayer(player: Player, match: Match) {
    match.enemy = player;
    match.status = MatchStatus.FULL;
  }

  private moveMatch(match: Match) {
    this.matchs.set(match.id, match);
    this.openedMatchs.delete(match.id);

    // this.saveMatch(match)
  }

  private deleteMatch(matchId: string) {
    this.matchs.delete(matchId);
  }

  private create(player: Player) {
    const match = new Match();
    match.id = uuidv4();
    match.player = player;
    match.status = MatchStatus.CREATED;
    match.history = [];

    this.openedMatchs.set(match.id, match);

    return match;
  }

  private saveMatch(match: Match) {
    // this.matchRepository.save(match)
  }

  saveMatchHistory(matchId: string) {
    const match = this.findMatch(matchId);

    if (match) {
      match.history.push(match.state!);
      this.saveMatch(match);
    }
  }

  async startMatch(matchId: string) {
    try {
      const match = await this.findMatch(matchId);

      if (match) {
        match.status = MatchStatus.IN_PROGRESS;

        // await this.matchRepository.update({ id: match.id }, match)
      }
    } catch (error) {
      this.logger.error(`Error starting match ${matchId}: ${error.message}`);
      throw error;
    }
  }

  async cancelMatch(matchId: string) {
    try {
      const match = await this.findMatch(matchId);

      if (match) {
        match.status = MatchStatus.CANCELLED;

        // await this.matchRepository.update({ id: match.id }, match)
        this.deleteMatch(match.id);
      }
    } catch (error) {
      this.logger.error(`Error starting match ${matchId}: ${error.message}`);
      throw error;
    }
  }

  cancelPlayerMatch(playerId: string) {
    try {
      let match = Array.from(this.openedMatchs.values()).find(
        (m) => m.player.id === playerId || m.enemy.id === playerId,
      );

      if (match) {
        this.openedMatchs.delete(match.id);
      } else {
        match = Array.from(this.matchs.values()).find(
          (m) => m.player.id === playerId || m.enemy.id === playerId,
        );
        this.cancelMatch(match!.id);
      }

      return match;
    } catch (error) {
      this.logger.error(
        `Error cancelling opened match for client ${playerId}: ${error.message}`,
      );
      throw error;
    }
  }

  async finishMatch(matchId: string) {
    try {
      const match = await this.findMatch(matchId);

      if (match) {
        match.status = MatchStatus.FINISHED;

        // await this.matchRepository.update({ id: match.id }, match)
        this.deleteMatch(match.id);
      }
    } catch (error) {
      this.logger.error(`Error starting match ${matchId}: ${error.message}`);
      throw error;
    }
  }

  getPlayerMatchView(matchId: string, playerId: string): any {
    const match = this.findMatch(matchId);

    if (!match) {
      throw new NotFoundException(`Match (${matchId}) not found`);
    }

    const isPlayer = match.player.id === playerId;

    return {
      isPlayer,
      player: match.player,
      enemy: match.enemy,
      playerGold: isPlayer ? match.state?.player.gold : match.state?.enemy.gold,
      units: Array.from(match.state?.units || []),
      activeTurn: match.state?.currentPlayer === playerId,
      store: [
        {
          id: 'unit-1',
          class: 'elf',
          name: 'Archer',
          price: 15,
          health: 15,
          attack: 5,
          defense: 2,
          range: 3,
          movement: 5,
        },
        {
          id: 'unit-2',
          class: 'elf',
          name: 'Soldier',
          price: 10,
          health: 20,
          attack: 4,
          defense: 4,
          range: 1,
          movement: 4,
        },
        {
          id: 'unit-3',
          class: 'elf',
          name: 'Cavalary',
          price: 20,
          health: 25,
          attack: 5,
          defense: 5,
          range: 1,
          movement: 7,
        },
      ],
      map: match.map,
    };
  }

  setGameState(matchId: string, state: GameState) {
    const match = this.findMatch(matchId);

    if (match) {
      match.state = state;
    }
  }

  getGameState(matchId: string): GameState {
    const match = this.findMatch(matchId);

    if (match && match.state) {
      return match.state;
    }

    throw new NotFoundException(`Match (${matchId}) not found`);
  }

  setMap(matchId: string, map: any) {
    const match = this.findMatch(matchId);

    if (match) {
      match.map = map;
    }
  }
}
