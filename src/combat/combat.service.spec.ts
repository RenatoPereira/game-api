import { Test, TestingModule } from '@nestjs/testing';
import { CombatService } from './combat.service';
import { ATTACKER_UNIT, DEFENDER_UNIT } from '../libs/helpers/test.helper';

describe('CombatService', () => {
  let service: CombatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CombatService],
    }).compile();

    service = module.get<CombatService>(CombatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should can attack a enemy', () => {
    const canAttack = service.canAttackUnit(ATTACKER_UNIT, DEFENDER_UNIT)

    expect(canAttack).toBeTruthy()
  });

  it('shouldn\'t attack a enemy', () => {
    const canAttack = service.canAttackUnit({
      ...ATTACKER_UNIT,
      state: {
        ...ATTACKER_UNIT.state,
        canAttack: false
      }
    }, DEFENDER_UNIT)

    expect(canAttack).toBeFalsy()
  });

  it('shouldn\'t attack a friend unit', () => {
    const canAttack = service.canAttackUnit(ATTACKER_UNIT, ATTACKER_UNIT)

    expect(canAttack).toBeFalsy()
  });

  it('should attack a enemy', () => {
    const result = service.attackUnit(ATTACKER_UNIT, DEFENDER_UNIT)
    const damage = result.damage

    expect(result.attacker.state.canAttack).toBeFalsy()
    expect(result.attacker.state.distanceCanMove).toBe(0)
    expect(result.defender?.state.health).toBe(DEFENDER_UNIT.state.health - damage)
  });

  it('should gain experience', () => {
    const result = service.gainExperience(ATTACKER_UNIT, 1)

    expect(result.state.experience).toBe(5)
  });

  it('should update level', () => {
    const result = service.gainExperience({
      ...ATTACKER_UNIT,
      state: {
        ...ATTACKER_UNIT.state,
        experience: 5,
      }
    }, 2)

    expect(result.unit.attack).toBe(Math.floor(ATTACKER_UNIT.unit.attack * 1.5))
    expect(result.unit.defense).toBe(Math.floor(ATTACKER_UNIT.unit.defense * 1.5))
    expect(result.unit.health).toBe(Math.floor(ATTACKER_UNIT.unit.health * 1.5))

    expect(result.state.experience).toBe(15)
    expect(result.state.level).toBe(2)
    expect(result.state.health).toBe(result.unit.health)
  });
});
