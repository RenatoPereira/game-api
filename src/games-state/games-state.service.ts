import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { GameState } from './entities/game-state.entity';
import { Match } from '../matchs/entities/match.entity';
import { Unit } from '../units/entities/unit.entity';
import { GameStateUnit, GameStateUnitState } from './interfaces/game-state.interface';
import { AxialCoordinates } from 'honeycomb-grid';
import { getUnitKey } from '../libs/tile.utils';
import { get } from 'http';

@Injectable()
export class GamesStateService {
    private readonly GOLD_PER_TURN = 10;

    createGameState(match: Match): GameState {
        return {
            currentPlayer: match.player.id,
            units: new Map<string, GameStateUnit>(),
            player: {
                id: match.player.id,
                gold: 100
            },
            enemy: {
                id: match.enemy.id,
                gold: 100
            }
        }
    }

    toggleCurrentPlayer(gameState: GameState) {
        return {
            ...gameState,
            currentPlayer: gameState.currentPlayer === gameState.player.id ? gameState.enemy.id : gameState.player.id
        }
    }

    increaseCurrentPlayerGold(gameState: GameState, amount?: number) {
        if (gameState.currentPlayer === gameState.player.id) {
            return {
                ...gameState,
                player: {
                    ...gameState.player,
                    gold: gameState.player.gold + (amount || this.GOLD_PER_TURN)
                }
            }
        }

        return {
            ...gameState,
            enemy: {
                ...gameState.enemy,
                gold: gameState.enemy.gold + (amount || this.GOLD_PER_TURN)
            }
        }
    }

    decreaseCurrentPlayerGold(gameState: GameState, amount: number) {
        if (gameState.currentPlayer === gameState.player.id) {
            const newAmount = gameState.player.gold - amount;

            if (newAmount < 0) {
                throw new NotAcceptableException('Not enough gold');
            }

            return {
                ...gameState,
                player: {
                    ...gameState.player,
                    gold: newAmount
                }
            }
        }

        const newAmount = gameState.enemy.gold - amount;

        if (newAmount < 0) {
            throw new NotAcceptableException('Not enough gold');
        }

        return {
            ...gameState,
            enemy: {
                ...gameState.enemy,
                gold: newAmount
            }
        }
    }

    getUnitFromGameState(gameState: GameState, position: AxialCoordinates): GameStateUnit {
        console.log({ gameState, position })
        const unit = gameState.units.get(getUnitKey(position));

        if (!unit) {
            throw new NotFoundException('Unit not found');
        }

        return unit
    }

    removeUnitFromGameState(gameState: GameState, position: AxialCoordinates) {
        gameState.units.delete(getUnitKey(position));

        return gameState
    }

    addUnitToGameState(gameState: GameState, unit: Unit, position: AxialCoordinates, canMove = false): GameState {
        const gameUnit = {
            id: crypto.randomUUID(),
            state: {
                health: unit.health,
                experience: 0,
                level: 1,
                playerId: gameState.currentPlayer,
                distanceCanMove: canMove ? unit.movement : 0,
                position,
                canAttack: false
            },
            unit
        }

        gameState.units.set(getUnitKey(position), gameUnit);

        return gameState
    }

    updateUnitInGameState(gameState: GameState, unit: GameStateUnit): GameState {
        gameState.units.set(getUnitKey(unit.state.position), unit);

        return gameState
    }

    updateUnitStateInGameState(gameState: GameState, position: AxialCoordinates, newState: Partial<GameStateUnitState>) {
        const unit = this.getUnitFromGameState(gameState, position);

        const updatedUnit = {
            ...unit,
            state: {
                ...unit.state,
                ...newState
            }
        }

        if (newState.position) {
            gameState.units.delete(getUnitKey(unit.state.position));
            gameState.units.set(getUnitKey(newState.position), updatedUnit);
        } else {
            gameState.units.set(getUnitKey(unit.state.position), updatedUnit);
        }

        return gameState
    }

    moveUnitFromTo(gameState: GameState, from: AxialCoordinates, to: AxialCoordinates, distance: number): GameState {
        const unit = this.getUnitFromGameState(gameState, from);

        if (unit.state.playerId !== gameState.currentPlayer) {
            throw new NotAcceptableException('Not your unit');
        }

        const updatedUnit = {
            ...unit,
            state: {
                ...unit.state,
                position: to,
                distanceCanMove: unit.state.distanceCanMove - distance
            }
        }

        gameState.units.delete(getUnitKey(from));
        gameState.units.set(getUnitKey(to), updatedUnit);

        return gameState
    }

    getCurrentPlayerUnits(gameState: GameState): GameStateUnit[] {
        return Array.from(gameState.units.values()).filter(u => u.state.playerId === gameState.currentPlayer);
    }

    resetCurrentPlayerUnitsDistance(gameState: GameState,): GameState {
        const units = this.getCurrentPlayerUnits(gameState);

        units.forEach(unit => {
            gameState.units.set(getUnitKey(unit.state.position), {
                ...unit,
                state: {
                    ...unit.state,
                    distanceCanMove: unit.unit.movement,
                    canAttack: true
                }
            })
        })

        return gameState
    }  

    getCurrentPlayerLeader(gameState: GameState): GameStateUnit {
        const leader = Array.from(gameState.units.values()).find(u => u.unit.leader && u.state.playerId === gameState.currentPlayer);

        if (!leader) {
            throw new NotFoundException('Leader not found');
        }

        return leader
    }
}
