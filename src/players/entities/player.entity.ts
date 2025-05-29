import { Column, PrimaryGeneratedColumn } from "typeorm";

export class Player {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    name: string;
}
