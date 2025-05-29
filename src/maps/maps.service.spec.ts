import { Test, TestingModule } from '@nestjs/testing';
import { MapsService } from './maps.service';

describe('MapsService', () => {
  let service: MapsService;

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
  };
  const unitState = {
    id: 'unit-state-1',
    unit,
    state: {
      health: unit.health,
      experience: 0,
      level: 1,
      distanceCanMove: unit.movement,
      playerId: 'player-1'
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MapsService],
    }).compile();

    service = module.get<MapsService>(MapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a map', () => {
    const map = service.create();

    expect(map).toBeDefined();
    expect(map.width).toBe(30);
    expect(map.height).toBe(30);
    expect(map.grid).toBeDefined();
  });

  it('should insert a unit into a map', () => {
    const map = service.create();
    const position = { q: 1, r: 1 };

    const updatedMap = service.insertUnit(map, unitState, position);

    expect(updatedMap.grid.getHex(position)?.getUnit()).toEqual(unitState);
    expect(updatedMap.grid.getHex(position)?.isOccupied()).toBeTruthy();
  });

  it('should move a unit into a map', () => {
    const map = service.create();
    const position = { q: 1, r: 1 };

    const updatedMap = service.insertUnit(map, unitState, position);
    
    const newPosition = { q: 2, r: 2 };
    const movedMap = service.moveFromTo(updatedMap, position, newPosition);

    expect(movedMap.grid.getHex(newPosition)?.getUnit()).toEqual({...unitState, state: {...unitState.state, distanceCanMove: 2}});
    expect(movedMap.grid.getHex(newPosition)?.isOccupied()).toBeTruthy();

    expect(movedMap.grid.getHex(position)?.getUnit()).toBeNull();
    expect(movedMap.grid.getHex(position)?.isOccupied()).toBeFalsy();
  })

  it('shouldn\'t move a unit into a map', () => {
    const map = service.create();
    const position = { q: 1, r: 1 };

    const updatedMap = service.insertUnit(map, unitState, position);
    
    const newPosition = { q: 6, r: 6 };
    try {
      const movedMap = service.moveFromTo(updatedMap, position, newPosition);
    } catch (e) {
      expect(e.response.message).toEqual('Cannot travel to this tile');
    }
  })
});
