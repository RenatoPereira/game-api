import { defineHex } from "honeycomb-grid";
import { GameStateUnit } from "../../games-state/interfaces/game-state.interface";

export class Tile extends defineHex({ dimensions: 30, origin: 'topLeft' }) {
    private terrain: string;
    private goldGenerate: number = 0;
    private unit: GameStateUnit | null = null;
    
    setTerrain(terrain: string) {
        this.terrain = terrain;
    }

    getTerrain(): string {
        return this.terrain;
    }

    setGoldGenerate(goldGenerate: number) {
        this.goldGenerate = goldGenerate;
    }

    getGoldGenerate(): number {
        return this.goldGenerate;
    }

    setUnit(unit: GameStateUnit | null) {
        this.unit = unit;
    }

    getUnit(): GameStateUnit | null {
        return this.unit;
    }

    isOccupied(): boolean {
        return this.unit !== null;
    }
}
