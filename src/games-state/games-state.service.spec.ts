import { Test, TestingModule } from '@nestjs/testing';
import { GamesStateService } from './games-state.service';
import { MatchStatus } from '../matchs/interfaces/match.interface';
import { Grid, rectangle } from 'honeycomb-grid';
import { Tile } from '../maps/entities/tile.entity';
import { UNIT_1, UNIT_2 } from '../libs/helpers/test.helper';

describe('GamesStateService', () => {
  let service: GamesStateService;

  const match = {
    id: 'match-1',
    player: {
      id: 'player-1',
      name: 'Player 1',
      leaderId: 'UNIT_1',
    },
    enemy: {
      id: 'player-2',
      name: 'Player 2',
      leaderId: 'UNIT_2',
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
    },
  };

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
      units: new Map(),
      player: {
        id: match.player.id,
        gold: 100,
      },
      enemy: {
        id: match.enemy.id,
        gold: 100,
      },
    });
  });

  it('should toggle current player', () => {
    const gameState = service.createGameState(match);

    expect(gameState.currentPlayer).toEqual(match.player.id);

    const toggledGameState = service.toggleCurrentPlayer(gameState);

    expect(toggledGameState.currentPlayer).toEqual(match.enemy.id);
  });

  it('should increase current player gold', () => {
    const gameState = service.createGameState(match);

    expect(gameState.player.gold).toEqual(100);

    const updatedGameState = service.increaseCurrentPlayerGold(gameState, 20);

    expect(updatedGameState.currentPlayer).toEqual(match.player.id);
    expect(updatedGameState.player.gold).toEqual(120);
    expect(updatedGameState.enemy.gold).toEqual(100);
  });

  it('should decrease current player gold', () => {
    const gameState = service.createGameState(match);

    expect(gameState.player.gold).toEqual(100);

    const updatedGameState = service.decreaseCurrentPlayerGold(gameState, 20);

    expect(updatedGameState.currentPlayer).toEqual(match.player.id);
    expect(updatedGameState.player.gold).toEqual(80);
    expect(updatedGameState.enemy.gold).toEqual(100);
  });

  it('should throw an error when trying to decrease gold when not enough', () => {
    const gameState = service.createGameState(match);

    expect(gameState.player.gold).toEqual(100);

    expect(() => {
      service.decreaseCurrentPlayerGold(gameState, 200);
    }).toThrowError('Not enough gold');
  });

  it('should add a unit to the game state', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };

    expect(gameState.units.size).toEqual(0);
    expect(() => {
      service.getUnitFromGameState(gameState, position);
    }).toThrow('Unit not found');

    const updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );

    expect(updatedGameState.units.size).toEqual(1);
    expect(
      service.getUnitFromGameState(updatedGameState, position),
    ).toBeDefined();
  });

  it('should get a unit from the game state', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };

    expect(gameState.units.size).toEqual(0);
    expect(() => {
      service.getUnitFromGameState(gameState, position);
    }).toThrow('Unit not found');

    const updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );

    expect(updatedGameState.units.size).toEqual(1);
    expect(
      service.getUnitFromGameState(updatedGameState, position),
    ).toBeDefined();
  });

  it('should remove a unit from the game state', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };

    const updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );

    expect(updatedGameState.units.size).toEqual(1);
    expect(
      service.getUnitFromGameState(updatedGameState, position),
    ).toBeDefined();

    const finalGameState = service.removeUnitFromGameState(
      updatedGameState,
      position,
    );

    expect(finalGameState.units.size).toEqual(0);
    expect(() => {
      service.getUnitFromGameState(finalGameState, position);
    }).toThrow('Unit not found');
  });

  it('should update a unit in the game state', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };

    const updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );

    const unit = service.getUnitFromGameState(updatedGameState, position);
    expect(unit.unit.name).toEqual(UNIT_1.name);

    const finalGameState = service.updateUnitInGameState(updatedGameState, {
      ...unit,
      unit: {
        ...unit.unit,
        name: 'Name modified',
      },
    });

    const unitModified = service.getUnitFromGameState(finalGameState, position);
    expect(unitModified.unit.name).toEqual('Name modified');
  });

  it('should update a unit state in the game state', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };

    const updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );

    expect(updatedGameState.units.size).toEqual(1);
    expect(
      service.getUnitFromGameState(updatedGameState, position),
    ).toBeDefined();

    const newState = {
      health:
        service.getUnitFromGameState(updatedGameState, position)!.state.health -
        1,
    };

    const finalGameState = service.updateUnitStateInGameState(
      updatedGameState,
      position,
      newState,
    );

    const updatedUnit = service.getUnitFromGameState(finalGameState, position);

    expect(updatedUnit.state.health).toEqual(newState.health);
  });

  it('should get currentPlayerUnits', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };

    let updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );
    updatedGameState = service.addUnitToGameState(updatedGameState, UNIT_2, {
      q: 0,
      r: 1,
    });

    expect(service.getCurrentPlayerUnits(updatedGameState).length).toEqual(2);

    const finalGameState = service.toggleCurrentPlayer(updatedGameState);

    expect(service.getCurrentPlayerUnits(finalGameState).length).toEqual(0);
  });

  it('should get getCurrentPlayerLeader', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };

    let updatedGameState = service.addUnitToGameState(
      gameState,
      {
        ...UNIT_1,
        leader: false,
      },
      position,
    );
    updatedGameState = service.addUnitToGameState(updatedGameState, UNIT_2, {
      q: 0,
      r: 1,
    });

    expect(service.getCurrentPlayerLeader(updatedGameState).unit).toEqual(
      UNIT_2,
    );
  });

  it('should reset current player units turn', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };
    const position2 = {
      q: 0,
      r: 1,
    };

    let updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );
    updatedGameState = service.addUnitToGameState(
      updatedGameState,
      UNIT_2,
      position2,
    );

    updatedGameState = service.updateUnitStateInGameState(
      updatedGameState,
      position,
      {
        canAttack: false,
        distanceCanMove: 0,
      },
    );

    updatedGameState = service.updateUnitStateInGameState(
      updatedGameState,
      position2,
      {
        canAttack: false,
        distanceCanMove: 1,
      },
    );

    let unit_1 = service.getUnitFromGameState(updatedGameState, position);
    expect(unit_1.state.canAttack).toBeFalsy();
    expect(unit_1.state.distanceCanMove).toBe(0);

    let unit_2 = service.getUnitFromGameState(updatedGameState, position2);
    expect(unit_2.state.canAttack).toBeFalsy();
    expect(unit_2.state.distanceCanMove).toBe(1);

    updatedGameState = service.resetCurrentPlayerUnitsTurn(updatedGameState);

    unit_1 = service.getUnitFromGameState(updatedGameState, position);
    expect(unit_1.state.canAttack).toBeTruthy();
    expect(unit_1.state.distanceCanMove).toBe(UNIT_1.movement);

    unit_2 = service.getUnitFromGameState(updatedGameState, position);
    expect(unit_2.state.canAttack).toBeTruthy();
    expect(unit_2.state.distanceCanMove).toBe(UNIT_2.movement);
  });

  it('should move unit from {q:0, r:0} to {q: 0, r: 1}', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };
    const position2 = {
      q: 0,
      r: 2,
    };

    let updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
      true,
    );

    expect(
      service.getUnitFromGameState(updatedGameState, position),
    ).toBeDefined();
    expect(() =>
      service.getUnitFromGameState(updatedGameState, position2),
    ).toThrow('Unit not found');

    updatedGameState = service.moveUnitFromTo(
      updatedGameState,
      position,
      position2,
      1,
    );

    expect(() =>
      service.getUnitFromGameState(updatedGameState, position),
    ).toThrow('Unit not found');
    expect(
      service.getUnitFromGameState(updatedGameState, position2),
    ).toBeDefined();
  });

  it('should throw error when trying to move unit from other player', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };
    const position2 = {
      q: 0,
      r: 2,
    };

    let updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );

    updatedGameState = service.toggleCurrentPlayer(updatedGameState);

    expect(() =>
      service.moveUnitFromTo(updatedGameState, position, position2, 1),
    ).toThrow('Not your unit');
  });

  it('should throw error for no movement enough unit from {q:0, r:0} to {q: 0, r: 1}', () => {
    const gameState = service.createGameState(match);
    const position = {
      q: 0,
      r: 0,
    };
    const position2 = {
      q: 0,
      r: 2,
    };

    let updatedGameState = service.addUnitToGameState(
      gameState,
      UNIT_1,
      position,
    );

    expect(() =>
      service.moveUnitFromTo(updatedGameState, position, position2, 1),
    ).toThrow('No movement energy enough');
  });
});
