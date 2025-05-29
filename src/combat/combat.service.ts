import { Injectable } from '@nestjs/common';
import { GameStateUnit } from '../games-state/interfaces/game-state.interface';

@Injectable()
export class CombatService {
    private readonly ATTACK_DAMAGE_EXTRA_MAX = 6;
    private readonly EXPERIENCE_TO_UP_LEVEL = {
        1: 10,
        2: 20,
        3: 30,
        4: 40,
        5: 50
    }
    private readonly LEVEL_UP_MULTIPLIER = 1.2;
    private readonly EXPERIENCE_BY_LEVEL = 5;

    attackUnit(attacker: GameStateUnit, defender: GameStateUnit) {
        const attackerDamage = this.getDamage(attacker.unit.attack, defender.unit.defense)

        let defenderState = {
            health: defender.state.health - attackerDamage
        }

        let attackerState = {
            canAttack: false,
            distanceCanMove: 0
        }

        return {
            damage: attackerDamage,
            defenderState,
            attackerState,
            isDead: defenderState.health <= 0
        }
    }

    gainExperience(attacker: GameStateUnit, defender: GameStateUnit) {
        const experienceGain = this.EXPERIENCE_BY_LEVEL * defender.state.level;
        const newExperience = attacker.state.experience + experienceGain;
        const evolved = newExperience >= this.EXPERIENCE_TO_UP_LEVEL[attacker.state.level]

        if (evolved) {
            attacker = this.levelUp(attacker);
        }

        const updatedUnit = {
            ...attacker, 
            state: {
                ...attacker.state,
                experience: newExperience
            }
        }

        return {
            unit: updatedUnit,
            state: {
                experience: newExperience,
                canAttack: false,
                distanceCanMove: 0
            },
            evolved
        }

    }

    canAttack(attacker: GameStateUnit) {
        return attacker.state.canAttack
    }

    private getDamage(attack: number, defense: number): number {
        const damage = (attack + Math.floor(Math.random() * (this.ATTACK_DAMAGE_EXTRA_MAX - 1))) - defense;

        if (damage < 0) {
            return 0;
        }

        return damage < 0 ? 0 : damage;

    }

    private levelUp(unit: GameStateUnit): GameStateUnit {
        return {
            ...unit,
            unit: {
                ...unit.unit,
                health: Math.floor(unit.state.health * this.LEVEL_UP_MULTIPLIER),
                attack: Math.floor(unit.unit.attack * this.LEVEL_UP_MULTIPLIER),
                defense: Math.floor(unit.unit.defense * this.LEVEL_UP_MULTIPLIER),
            },
            state: {
                ...unit.state,
                level: unit.state.level + 1,
                health: Math.floor(unit.state.health * this.LEVEL_UP_MULTIPLIER),
            }
        }
    }
}
