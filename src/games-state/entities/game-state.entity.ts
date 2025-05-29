import { Column, Entity } from "typeorm";
import { GameStatePlayer, GameStateUnit } from "../interfaces/game-state.interface";

@Entity()
export class GameState {
    @Column()
    currentPlayer: string;

    @Column()
    units: Map<string, GameStateUnit>;

    @Column()
    player: GameStatePlayer;

    @Column()
    enemy: GameStatePlayer;
}
