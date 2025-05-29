import { Column, Entity } from "typeorm";

@Entity()
export class Unit {
    @Column()
    id: string;

    @Column()
    leader: boolean;

    @Column()
    class: string;

    @Column()
    name: string;

    @Column()
    price: number;

    @Column()
    health: number;

    @Column()
    attack: number;

    @Column()
    defense: number;

    @Column()
    movement: number;

    @Column()
    range: number;
}

export const Konrad = {
    id: 'konrad',
    leader: true,
    class: 'human',
    name: 'Konrad',
    price: Infinity,
    health: 25,
    attack: 8,
    defense: 5,
    range: 1,
    movement: 4
}

export const DemonKing = {
    id: 'demon-king',
    leader: true,
    class: 'demon',
    name: 'Demon King',
    price: Infinity,
    health: 30,
    attack: 7,
    defense: 6,
    range: 1,
    movement: 4
}