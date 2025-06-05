import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Tile } from "./tile.entity";
import { Grid } from "honeycomb-grid";

@Entity()
export class MapTable {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    height: number;

    @Column()
    width: number;
}
