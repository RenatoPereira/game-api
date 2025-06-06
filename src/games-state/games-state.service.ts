import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { GameState } from './entities/game-state.entity';
import { Match } from '../matchs/entities/match.entity';
import { Unit } from '../units/entities/unit.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  GameStateUnit,
  GameStateUnitState,
} from './interfaces/game-state.interface';
import { AxialCoordinates } from 'honeycomb-grid';
import { getUnitKey } from '../libs/tile.utils';
import { deepClone } from '../libs/object.utils';

@Injectable()
export class GamesStateService {
  private readonly GOLD_PER_TURN = 10;

  createGameState(match: Match): GameState {
    return {
      currentPlayer: match.player.id,
      units: new Map<string, GameStateUnit>(),
      player: {
        id: match.player.id,
        gold: 100,
      },
      enemy: {
        id: match.enemy.id,
        gold: 100,
      },
    };
  }

  toggleCurrentPlayer(gameState: GameState) {
    const tmpState = deepClone(gameState);

    return {
      ...tmpState,
      currentPlayer:
        tmpState.currentPlayer === tmpState.player.id
          ? tmpState.enemy.id
          : tmpState.player.id,
    };
  }

  increaseCurrentPlayerGold(gameState: GameState, amount?: number) {
    const tmpState = deepClone(gameState);

    if (tmpState.currentPlayer === tmpState.player.id) {
      return {
        ...tmpState,
        player: {
          ...tmpState.player,
          gold: tmpState.player.gold + (amount || this.GOLD_PER_TURN),
        },
      };
    }

    return {
      ...tmpState,
      enemy: {
        ...tmpState.enemy,
        gold: tmpState.enemy.gold + (amount || this.GOLD_PER_TURN),
      },
    };
  }

  decreaseCurrentPlayerGold(gameState: GameState, amount: number) {
    const tmpState = deepClone(gameState);

    if (tmpState.currentPlayer === tmpState.player.id) {
      const newAmount = tmpState.player.gold - amount;

      if (newAmount < 0) {
        throw new NotAcceptableException('Not enough gold');
      }

      return {
        ...tmpState,
        player: {
          ...tmpState.player,
          gold: newAmount,
        },
      };
    }

    const newAmount = tmpState.enemy.gold - amount;

    if (newAmount < 0) {
      throw new NotAcceptableException('Not enough gold');
    }

    return {
      ...tmpState,
      enemy: {
        ...tmpState.enemy,
        gold: newAmount,
      },
    };
  }

  getUnitFromGameState(
    gameState: GameState,
    position: AxialCoordinates,
  ): GameStateUnit {
    const unit = gameState.units.get(getUnitKey(position));

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  removeUnitFromGameState(gameState: GameState, position: AxialCoordinates) {
    const tmpState = deepClone(gameState);

    tmpState.units.delete(getUnitKey(position));

    return tmpState;
  }

  addUnitToGameState(
    gameState: GameState,
    unit: Unit,
    position: AxialCoordinates,
    canMove = false,
  ): GameState {
    const tmpState = deepClone(gameState);
    const gameUnit = {
      id: uuidv4(),
      state: {
        health: unit.health,
        experience: 0,
        level: 1,
        playerId: tmpState.currentPlayer,
        distanceCanMove: canMove ? unit.movement : 0,
        position,
        canAttack: false,
      },
      unit,
    };

    tmpState.units.set(getUnitKey(position), gameUnit);

    return tmpState;
  }

  updateUnitInGameState(gameState: GameState, unit: GameStateUnit): GameState {
    const tmpState = deepClone(gameState);

    tmpState.units.set(getUnitKey(unit.state.position), unit);

    return tmpState;
  }

  updateUnitStateInGameState(
    gameState: GameState,
    position: AxialCoordinates,
    newState: Partial<GameStateUnitState>,
  ) {
    const tmpState = deepClone(gameState);
    const unit = this.getUnitFromGameState(tmpState, position);

    const updatedUnit = {
      ...unit,
      state: {
        ...unit.state,
        ...newState,
      },
    };

    if (newState.position) {
      tmpState.units.delete(getUnitKey(unit.state.position));
      tmpState.units.set(getUnitKey(newState.position), updatedUnit);
    } else {
      tmpState.units.set(getUnitKey(unit.state.position), updatedUnit);
    }

    return tmpState;
  }

  moveUnitFromTo(
    gameState: GameState,
    from: AxialCoordinates,
    to: AxialCoordinates,
    distance: number,
  ): GameState {
    const tmpState = deepClone(gameState);
    const unit = this.getUnitFromGameState(tmpState, from);

    if (unit.state.playerId !== gameState.currentPlayer) {
      throw new NotAcceptableException('Not your unit');
    }

    const newDistanceCanMove = unit.state.distanceCanMove - distance;

    if (newDistanceCanMove < 0)
      throw new NotAcceptableException('No movement energy enough');

    const updatedUnit = {
      ...unit,
      state: {
        ...unit.state,
        position: to,
        distanceCanMove: unit.state.distanceCanMove - distance,
      },
    };

    tmpState.units.delete(getUnitKey(from));
    tmpState.units.set(getUnitKey(to), updatedUnit);

    return tmpState;
  }

  getCurrentPlayerUnits(gameState: GameState): GameStateUnit[] {
    return Array.from(gameState.units.values()).filter(
      (u) => u.state.playerId === gameState.currentPlayer,
    );
  }

  resetCurrentPlayerUnitsTurn(gameState: GameState): GameState {
    const tmpState = deepClone(gameState);
    const units = this.getCurrentPlayerUnits(tmpState);

    units.forEach((unit) => {
      tmpState.units.set(getUnitKey(unit.state.position), {
        ...unit,
        state: {
          ...unit.state,
          distanceCanMove: unit.unit.movement,
          canAttack: true,
        },
      });
    });

    return tmpState;
  }

  getCurrentPlayerLeader(gameState: GameState): GameStateUnit {
    const leader = Array.from(gameState.units.values()).find(
      (u) => u.unit.leader && u.state.playerId === gameState.currentPlayer,
    );

    if (!leader) {
      throw new NotFoundException('Leader not found');
    }

    return leader;
  }
}
