import { Test, TestingModule } from '@nestjs/testing';
import { MatchsService } from './matchs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { MatchStatus } from './interfaces/match.interface';
import { NotFoundException } from '@nestjs/common';
import { MapTable } from '../maps/entities/map.entity';
import { UNITS } from '../units/entities/units';

const mockRepository = {
  find: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe('MatchsService', () => {
  let service: MatchsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchsService,
        {
          provide: getRepositoryToken(Match),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MatchsService>(MatchsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a match', () => {
    const player = {
      id: 'player-1',
      name: 'Player 1',
      leaderId: UNITS['unit-claude'].id,
    };

    const match = service.findOrCreate(player);

    expect(match).toBeDefined();
    expect(match.id).toBeDefined();
    expect(match.player.id).toBe(player.id);
    expect(match.enemy).toBeUndefined();
    expect(match.status).toBe(MatchStatus.CREATED);
  });

  it('should find a opened match and insert a new player', () => {
    const player = {
      id: 'player-1',
      name: 'Player 1',
      leaderId: UNITS['unit-claude'].id,
    };
    const enemy = {
      id: 'enemy-1',
      name: 'Enemy 1',
      leaderId: UNITS['unit-rena'].id,
    };

    const match = service.findOrCreate(player);

    expect(match).toBeDefined();
    expect(match.id).toBeDefined();
    expect(match.player.id).toBe(player.id);
    expect(match.enemy).toBeUndefined();
    expect(match.status).toBe(MatchStatus.CREATED);

    const match2 = service.findOrCreate(enemy);

    expect(match2).toBeDefined();
    expect(match2.id).toBeDefined();
    expect(match2.player.id).toBe(player.id);
    expect(match2.enemy.id).toBe(enemy.id);
    expect(match2.status).toBe(MatchStatus.FULL);
  });

  it('should find a match', () => {
    const player = {
      id: 'player-1',
      name: 'Player 1',
      leaderId: UNITS['unit-claude'].id,
    };
    const enemy = {
      id: 'enemy-1',
      name: 'Enemy 1',
      leaderId: UNITS['unit-rena'].id,
    };

    const match = service.findOrCreate(player);

    expect(match).toBeDefined();
    expect(match.id).toBeDefined();
    expect(match.player.id).toBe(player.id);
    expect(match.enemy).toBeUndefined();
    expect(match.status).toBe(MatchStatus.CREATED);

    const match2 = service.findOrCreate(enemy);

    expect(match2).toBeDefined();
    expect(match2.id).toBeDefined();
    expect(match2.player.id).toBe(player.id);
    expect(match2.enemy.id).toBe(enemy.id);
    expect(match2.status).toBe(MatchStatus.FULL);

    const findedMatch = service.findMatch(match.id);
    expect(findedMatch).toBeDefined();
    expect(findedMatch?.id).toBe(match.id);
  });

  it('should throw an error when match not found', () => {
    const matchId = 'non-existing-match-id';

    try {
      service.findMatch(matchId);
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error).toBeDefined();
    }
  });

  it('should start a match', async () => {
    const player = {
      id: 'player-1',
      name: 'Player 1',
      leaderId: UNITS['unit-claude'].id,
    };
    const enemy = {
      id: 'enemy-1',
      name: 'Enemy 1',
      leaderId: UNITS['unit-rena'].id,
    };

    const match = service.findOrCreate(player);

    expect(match).toBeDefined();
    expect(match.id).toBeDefined();
    expect(match.player.id).toBe(player.id);
    expect(match.enemy).toBeUndefined();
    expect(match.status).toBe(MatchStatus.CREATED);

    const match2 = service.findOrCreate(enemy);

    expect(match2).toBeDefined();
    expect(match2.id).toBeDefined();
    expect(match2.player.id).toBe(player.id);
    expect(match2.enemy.id).toBe(enemy.id);
    expect(match2.status).toBe(MatchStatus.FULL);

    const findedMatch = service.findMatch(match.id);

    if (!findedMatch) {
      fail('Match not found');
    }

    expect(findedMatch).toBeDefined();
    expect(findedMatch.id).toBe(match.id);

    await service.startMatch(findedMatch.id);
    expect(findedMatch.status).toBe(MatchStatus.IN_PROGRESS);
  });

  it('should throw an error when match not found', async () => {
    const matchId = 'non-existing-match-id';

    await expect(service.startMatch(matchId)).rejects.toThrow(
      `Match (${matchId}) not found`,
    );
  });

  it('should cancel a match', async () => {
    const player = {
      id: 'player-1',
      name: 'Player 1',
      leaderId: UNITS['unit-claude'].id,
    };
    const enemy = {
      id: 'enemy-1',
      name: 'Enemy 1',
      leaderId: UNITS['unit-rena'].id,
    };

    const match = service.findOrCreate(player);

    expect(match).toBeDefined();
    expect(match.id).toBeDefined();
    expect(match.player.id).toBe(player.id);
    expect(match.enemy).toBeUndefined();
    expect(match.status).toBe(MatchStatus.CREATED);

    const match2 = service.findOrCreate(enemy);

    expect(match2).toBeDefined();
    expect(match2.id).toBeDefined();
    expect(match2.player.id).toBe(player.id);
    expect(match2.enemy.id).toBe(enemy.id);
    expect(match2.status).toBe(MatchStatus.FULL);

    const findedMatch = service.findMatch(match.id);

    if (!findedMatch) {
      fail('Match not found');
    }

    expect(findedMatch).toBeDefined();
    expect(findedMatch.id).toBe(match.id);

    await service.cancelMatch(findedMatch.id);
    expect(findedMatch.status).toBe(MatchStatus.CANCELLED);
  });

  it('should throw an error when match not found', async () => {
    const matchId = 'non-existing-match-id';

    await expect(service.cancelMatch(matchId)).rejects.toThrow(
      `Match (${matchId}) not found`,
    );
  });

  it('should end a match', async () => {
    const player = {
      id: 'player-1',
      name: 'Player 1',
      leaderId: UNITS['unit-claude'].id,
    };
    const enemy = {
      id: 'enemy-1',
      name: 'Enemy 1',
      leaderId: UNITS['unit-rena'].id,
    };

    const match = service.findOrCreate(player);

    expect(match).toBeDefined();
    expect(match.id).toBeDefined();
    expect(match.player.id).toBe(player.id);
    expect(match.enemy).toBeUndefined();
    expect(match.status).toBe(MatchStatus.CREATED);

    const match2 = service.findOrCreate(enemy);

    expect(match2).toBeDefined();
    expect(match2.id).toBeDefined();
    expect(match2.player.id).toBe(player.id);
    expect(match2.enemy.id).toBe(enemy.id);
    expect(match2.status).toBe(MatchStatus.FULL);

    const findedMatch = service.findMatch(match.id);

    if (!findedMatch) {
      fail('Match not found');
    }

    expect(findedMatch).toBeDefined();
    expect(findedMatch.id).toBe(match.id);

    await service.finishMatch(findedMatch.id);
    expect(findedMatch.status).toBe(MatchStatus.FINISHED);
  });

  it('should throw an error when match not found', async () => {
    const matchId = 'non-existing-match-id';

    await expect(service.finishMatch(matchId)).rejects.toThrow(
      `Match (${matchId}) not found`,
    );
  });

  it('should set a match game state', async () => {
    const player = {
      id: 'player-1',
      name: 'Player 1',
      leaderId: UNITS['unit-claude'].id,
    };
    const enemy = {
      id: 'enemy-1',
      name: 'Enemy 1',
      leaderId: UNITS['unit-rena'].id,
    };

    const match = service.findOrCreate(player);

    expect(match).toBeDefined();
    expect(match.id).toBeDefined();
    expect(match.player.id).toBe(player.id);
    expect(match.enemy).toBeUndefined();
    expect(match.status).toBe(MatchStatus.CREATED);

    const match2 = service.findOrCreate(enemy);

    expect(match2).toBeDefined();
    expect(match2.id).toBeDefined();
    expect(match2.player.id).toBe(player.id);
    expect(match2.enemy.id).toBe(enemy.id);
    expect(match2.status).toBe(MatchStatus.FULL);

    const findedMatch = service.findMatch(match.id);

    if (!findedMatch) {
      fail('Match not found');
    }

    expect(findedMatch).toBeDefined();
    expect(findedMatch.id).toBe(match.id);

    const gameState = {
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
    };

    await service.setGameState(findedMatch.id, gameState);

    expect(findedMatch.state).toEqual(gameState);
  });

  it('should set a match map', () => {
    const player = {
      id: 'player-1',
      name: 'Player 1',
      leaderId: UNITS['unit-claude'].id,
    };
    const enemy = {
      id: 'enemy-1',
      name: 'Enemy 1',
      leaderId: UNITS['unit-rena'].id,
    };

    const match = service.findOrCreate(player);

    expect(match).toBeDefined();
    expect(match.id).toBeDefined();
    expect(match.player.id).toBe(player.id);
    expect(match.enemy).toBeUndefined();
    expect(match.status).toBe(MatchStatus.CREATED);

    const match2 = service.findOrCreate(enemy);

    expect(match2).toBeDefined();
    expect(match2.id).toBeDefined();
    expect(match2.player.id).toBe(player.id);
    expect(match2.enemy.id).toBe(enemy.id);
    expect(match2.status).toBe(MatchStatus.FULL);

    const findedMatch = service.findMatch(match.id);

    if (!findedMatch) {
      fail('Match not found');
    }

    expect(findedMatch).toBeDefined();
    expect(findedMatch.id).toBe(match.id);

    const map = new MapTable();

    service.setMap(findedMatch.id, map);

    expect(findedMatch.map).toEqual(map);
  });
});
