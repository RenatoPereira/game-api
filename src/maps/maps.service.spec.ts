import { Test, TestingModule } from '@nestjs/testing';
import { MapsService } from './maps.service';
import { ATTACKER_UNIT, DEFENDER_UNIT } from '../libs/helpers/test.helper';
import { getUnitKey } from '../libs/tile.utils';
import { BadRequestException } from '@nestjs/common/exceptions';

const getGridPopulated = (service: MapsService) => {
  const map = service.create();

  const units = new Map();
  units.set(getUnitKey(ATTACKER_UNIT.state.position), ATTACKER_UNIT);
  units.set(getUnitKey(DEFENDER_UNIT.state.position), DEFENDER_UNIT);

  return service.populateMap(map, units);
};

describe('MapsService', () => {
  let service: MapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MapsService],
    }).compile();

    service = module.get<MapsService>(MapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a default map', () => {
    const map = service.create();

    expect(map).toBeDefined();
    expect(map.height).toBe(12);
    expect(map.width).toBe(20);
  });

  it('should create a custom map', () => {
    const map = service.create(30, 30);

    expect(map).toBeDefined();
    expect(map.height).toBe(30);
    expect(map.width).toBe(30);
  });

  it('should populate a map with units', () => {
    const populatedGrid = getGridPopulated(service);

    expect(populatedGrid).toBeDefined();

    const populatedAttackerTile = populatedGrid.getHex(
      ATTACKER_UNIT.state.position,
    );
    const populatedDefenderTile = populatedGrid.getHex(
      DEFENDER_UNIT.state.position,
    );

    expect(populatedAttackerTile).toBeDefined();
    expect(populatedAttackerTile?.getUnit()).toEqual(ATTACKER_UNIT);

    expect(populatedDefenderTile).toBeDefined();
    expect(populatedDefenderTile?.getUnit()).toEqual(DEFENDER_UNIT);
  });

  it('Should get distance to', () => {
    const populatedGrid = getGridPopulated(service);

    const distanceTo = service.getDistanceToIfCanTravel(
      populatedGrid,
      ATTACKER_UNIT.state.position,
      { q: 3, r: 0 },
    );

    expect(distanceTo).toBe(3);
  });

  it('Should get distance to with a unit between', () => {
    const populatedGrid = getGridPopulated(service);

    const distanceTo = service.getDistanceToIfCanTravel(
      populatedGrid,
      ATTACKER_UNIT.state.position,
      { q: 0, r: 2 },
    );

    expect(distanceTo).toBe(3);
  });

  it('Should throw error to get distance from invalid Tile', () => {
    const populatedGrid = getGridPopulated(service);

    expect(() => {
      service.getDistanceToIfCanTravel(
        populatedGrid,
        { q: -100, r: -100 },
        ATTACKER_UNIT.state.position,
      );
    }).toThrow('Tile not found');
  });

  it('Should throw error to get distance from empty Tile', () => {
    const populatedGrid = getGridPopulated(service);

    expect(() => {
      service.getDistanceToIfCanTravel(
        populatedGrid,
        { q: 0, r: 3 },
        ATTACKER_UNIT.state.position,
      );
    }).toThrow('From Tile is not occupied');
  });

  it('Should throw error to get distance to ocupied Tile', () => {
    const populatedGrid = getGridPopulated(service);

    expect(() => {
      service.getDistanceToIfCanTravel(
        populatedGrid,
        ATTACKER_UNIT.state.position,
        DEFENDER_UNIT.state.position,
      );
    }).toThrow('To Tile is occupied');
  });

  it('Should throw error to get distance far away', () => {
    const populatedGrid = getGridPopulated(service);

    expect(() => {
      service.getDistanceToIfCanTravel(
        populatedGrid,
        ATTACKER_UNIT.state.position,
        { q: 5, r: 5 },
      );
    }).toThrow('No movement enough');
  });

  it('Should true to can attack', () => {
    const populatedGrid = getGridPopulated(service);

    const distanceTo = service.canAtack(
      populatedGrid,
      ATTACKER_UNIT.state.position,
      DEFENDER_UNIT.state.position,
    );

    expect(distanceTo).toBeTruthy();
  });

  it('Should return false to can attack far away', () => {
    const map = service.create();

    const MODIFIED_DEFENDER_UNIT = {
      ...DEFENDER_UNIT,
      state: {
        ...DEFENDER_UNIT.state,
        position: {
          q: 0,
          r: 5,
        },
      },
    };

    const units = new Map();
    units.set(getUnitKey(ATTACKER_UNIT.state.position), ATTACKER_UNIT);
    units.set(
      getUnitKey(MODIFIED_DEFENDER_UNIT.state.position),
      MODIFIED_DEFENDER_UNIT,
    );

    const populatedGrid = service.populateMap(map, units);

    const distanceTo = service.canAtack(
      populatedGrid,
      ATTACKER_UNIT.state.position,
      MODIFIED_DEFENDER_UNIT.state.position,
    );

    expect(distanceTo).toBeFalsy();
  });

  it("Should return false to unit that can't attack", () => {
    const map = service.create();

    const MODIFIED_ATTACKER_UNIT = {
      ...ATTACKER_UNIT,
      state: {
        ...ATTACKER_UNIT.state,
        canAttack: false,
      },
    };

    const units = new Map();
    units.set(
      getUnitKey(MODIFIED_ATTACKER_UNIT.state.position),
      MODIFIED_ATTACKER_UNIT,
    );
    units.set(getUnitKey(DEFENDER_UNIT.state.position), DEFENDER_UNIT);

    const populatedGrid = service.populateMap(map, units);

    const distanceTo = service.canAtack(
      populatedGrid,
      ATTACKER_UNIT.state.position,
      DEFENDER_UNIT.state.position,
    );

    expect(distanceTo).toBeFalsy();
  });

  it('Should throw error to can attack from invalid Tile', () => {
    const populatedGrid = getGridPopulated(service);

    expect(() => {
      service.canAtack(
        populatedGrid,
        { q: -100, r: -100 },
        DEFENDER_UNIT.state.position,
      );
    }).toThrow('Tile not found');
  });

  it('Should throw error to can attack from empty Tile', () => {
    const populatedGrid = getGridPopulated(service);

    expect(() => {
      service.canAtack(
        populatedGrid,
        { q: 0, r: 3 },
        DEFENDER_UNIT.state.position,
      );
    }).toThrow('From Tile is not occupied');
  });

  it('Should throw error to can attack to ocupied Tile', () => {
    const populatedGrid = getGridPopulated(service);

    expect(() => {
      service.canAtack(populatedGrid, ATTACKER_UNIT.state.position, {
        q: 1,
        r: 0,
      });
    }).toThrow('To Tile is not occupied');
  });

  it('Should get all enables position around hex', () => {
    const populatedGrid = getGridPopulated(service);

    const enablePosition = service.getEnablePositionAround(
      populatedGrid,
      ATTACKER_UNIT.state.position,
    );

    expect(enablePosition).toBeDefined();
    expect(enablePosition).toMatchObject({ q: 1, r: 0 });
  });
});
