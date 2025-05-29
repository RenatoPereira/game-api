import { AxialCoordinates } from "honeycomb-grid";
import { Unit } from "../../units/entities/unit.entity";

export interface GameStatePlayer {
    id: string;
    gold: number;
}

export interface GameStateUnit {
    id: string;
    unit: Unit;
    state: GameStateUnitState
}

export interface GameStateUnitState {
    playerId: string;
    health: number;
    experience: number;
    level: number;
    distanceCanMove: number;
    position: AxialCoordinates;
    canAttack: boolean;
}