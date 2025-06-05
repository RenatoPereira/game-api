import { Injectable } from '@nestjs/common';
import { GameStateUnit } from '../games-state/interfaces/game-state.interface';

@Injectable()
export class CombatService {
  private readonly ATTACK_DAMAGE_EXTRA_MAX = 4;
  private readonly EXPERIENCE_TO_UP_LEVEL = {
    1: 10,
    2: 20,
    3: 40,
    4: 80,
    5: 160,
  };
  private readonly LEVEL_UP_MULTIPLIER = 1.5;
  private readonly EXPERIENCE_BY_LEVEL = 5;

  attackUnit(attacker: GameStateUnit, defender: GameStateUnit) {
    const attackerDamage = this.getDamage(
      attacker.unit.attack,
      defender.unit.defense,
    );

    let updatedDefenderState = {
      health: defender.state.health - attackerDamage,
    };

    const isEnemyDead = updatedDefenderState.health <= 0;

    const updatedAttacker = isEnemyDead
      ? this.gainExperience(attacker, defender.state.level)
      : attacker;

    return {
      damage: attackerDamage,
      defender: isEnemyDead
        ? null
        : {
            ...defender,
            state: {
              ...defender.state,
              ...updatedDefenderState,
            },
          },
      attacker: {
        ...updatedAttacker,
        state: {
          ...updatedAttacker.state,
          canAttack: false,
          distanceCanMove: 0,
        },
      },
    };
  }

  gainExperience(attacker: GameStateUnit, enemyLevel: number) {
    const experienceGain = this.EXPERIENCE_BY_LEVEL * enemyLevel;
    const newExperience = attacker.state.experience + experienceGain;
    const gainLevel =
      newExperience >= this.EXPERIENCE_TO_UP_LEVEL[attacker.state.level];

    if (gainLevel) {
      attacker = this.levelUp(attacker);
    }

    return {
      ...attacker,
      state: {
        ...attacker.state,
        experience: newExperience,
      },
    };
  }

  canAttackUnit(attacker: GameStateUnit, defender: GameStateUnit) {
    return (
      attacker.state.canAttack &&
      attacker.state.playerId !== defender.state.playerId
    );
  }

  private getDamage(attack: number, defense: number): number {
    const damage =
      attack +
      Math.floor(Math.random() * (this.ATTACK_DAMAGE_EXTRA_MAX - 1)) -
      defense;

    if (damage < 0) {
      return 0;
    }

    return damage < 0 ? 0 : damage;
  }

  private levelUp(unit: GameStateUnit): GameStateUnit {
    const updatedUnit = {
      ...unit.unit,
      health: Math.floor(unit.state.health * this.LEVEL_UP_MULTIPLIER),
      attack: Math.floor(unit.unit.attack * this.LEVEL_UP_MULTIPLIER),
      defense: Math.floor(unit.unit.defense * this.LEVEL_UP_MULTIPLIER),
    };

    return {
      ...unit,
      unit: updatedUnit,
      state: {
        ...unit.state,
        level: unit.state.level + 1,
        health: updatedUnit.health,
      },
    };
  }
}
