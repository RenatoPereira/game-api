import { GameState } from "../../games-state/entities/game-state.entity";
import { Player } from "../../players/entities/player.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { MapTable } from "../../maps/entities/map.entity";

@Entity()
export class Match {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    player: Player;

    @Column()
    enemy: Player;

    @Column()
    map: MapTable;

    @Column()
    state: GameState | null;

    @Column()
    status: string;

    @Column()
    history: GameState[];
}
