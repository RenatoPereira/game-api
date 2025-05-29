import { Test, TestingModule } from '@nestjs/testing';
import { GamesStateService } from './games-state.service';
import { MatchStatus } from '../matchs/interfaces/match.interface';
import { Grid, rectangle } from 'honeycomb-grid';
import { Tile } from '../maps/entities/tile.entity';

describe('GamesStateService', () => {
  let service: GamesStateService;

  const match = {
    id: 'match-1',
    player: {
      id: 'player-1',
      name: 'Player 1',
    },
    enemy: {
      id: 'player-2',
      name: 'Player 2',
    },
    state: null,
    status: MatchStatus.FULL,
    history: [],
    map: {
      id: 'map-1',
      name: 'Map 1',
      width: 10,
      height: 10,
      grid: new Grid(Tile, rectangle({ width: 10, height: 10 })),
    }
  };

  const unit = {
    id: 'unit-1',
    class: 'elf',
    name: 'Archer',
    price: 10,
    health: 15,
    attack: 5,
    defense: 2,
    range: 3,
    movement: 5
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamesStateService],
    }).compile();

    service = module.get<GamesStateService>(GamesStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize game state', () => {
    const gameState = service.createGameState(match);

    expect(gameState).toEqual({
      currentPlayer: match.player.id,
      units: [],
      player: {
        id: match.player.id,
        gold: 100,
      },
      enemy: {
        id: match.enemy.id,
        gold: 100,
      },
    });
  })

  it ('should toggle current player', () => {
    const gameState = service.createGameState(match);

    expect(gameState.currentPlayer).toEqual(match.player.id);

    const toggledGameState = service.toggleCurrentPlayer(gameState);

    expect(toggledGameState.currentPlayer).toEqual(match.enemy.id);
  })

  it('should increase current player gold', () => {
    const gameState = service.createGameState(match);

    expect(gameState.player.gold).toEqual(100);

    const updatedGameState = service.increaseCurrentPlayerGold(gameState, 20);

    expect(updatedGameState.currentPlayer).toEqual(match.player.id);
    expect(updatedGameState.player.gold).toEqual(120);
    expect(updatedGameState.enemy.gold).toEqual(100);
  })

  it('should decrease current player gold', () => {
    const gameState = service.createGameState(match);

    expect(gameState.player.gold).toEqual(100);

    const updatedGameState = service.decreaseCurrentPlayerGold(gameState, 20);

    expect(updatedGameState.currentPlayer).toEqual(match.player.id);
    expect(updatedGameState.player.gold).toEqual(80);
    expect(updatedGameState.enemy.gold).toEqual(100);
  })

  it('should throw an error when trying to decrease gold when not enough', () => {
    const gameState = service.createGameState(match);

    expect(gameState.player.gold).toEqual(100);

    expect(() => {
      service.decreaseCurrentPlayerGold(gameState, 200);
    }).toThrowError('Not enough gold');
  })

  it('should add a unit to the game state', () => {
    const gameState = service.createGameState(match);

    expect(gameState.units.length).toEqual(0);

    const updatedGameState = service.addUnitToGameState(gameState, unit);

    expect(updatedGameState.units.length).toEqual(1);
  })

  it('should remove a unit from the game state', () => {
    const gameState = service.createGameState(match);

    const updatedGameState = service.addUnitToGameState(gameState, unit);

    expect(updatedGameState.units.length).toEqual(1);

    const unitId = updatedGameState.units[0].id;

    const finalGameState = service.removeUnitFromGameState(updatedGameState, unitId);

    expect(finalGameState.units.length).toEqual(0);
  })

  it('should update a unit in the game state', () => {
    const gameState = service.createGameState(match);

    const updatedGameState = service.addUnitToGameState(gameState, unit);

    expect(updatedGameState.units.length).toEqual(1);

    const newState = {
      health: updatedGameState.units[0].state.health - 1,
    };

    const unitId = updatedGameState.units[0].id;
    const finalGameState = service.updateUnitStateInGameState(updatedGameState, unitId, newState);

    const updatedUnit = service.getUnitFromGameState(finalGameState, unitId);

    expect(updatedUnit.state.health).toEqual(newState.health);
  })
});
