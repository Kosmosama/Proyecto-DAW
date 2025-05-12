import { PokemonSet } from '@pkmn/data';
import { Player } from 'src/player/entities/player.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Team {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'jsonb' })
    data: PokemonSet[];

    @Column({ length: 50 })
    format: string;

    @CreateDateColumn()
    createdAt: Date; // Check if sets date automatically

    @ManyToOne(() => Player, (player) => player.teams, { onDelete: 'CASCADE' })
    player: Player;
}
