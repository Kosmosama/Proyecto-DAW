import { Player } from 'src/player/player.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Chat {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Player, { eager: true })
    @JoinColumn({ name: 'player1_id' })
    player1: Player;

    @ManyToOne(() => Player, { eager: true })
    @JoinColumn({ name: 'player2_id' })
    player2: Player;

    @Column({ type: 'jsonb' })
    messages: any;
}
