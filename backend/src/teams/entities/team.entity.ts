import { Player } from 'src/player/entities/player.entity';
import { BeforeInsert, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Team {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'jsonb' })
    data: any;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Player, (player) => player.teams, { onDelete: 'CASCADE' })
    player: Player;

    @BeforeInsert()
    async setCreatedAt() {
        this.createdAt = new Date();
    }
}
