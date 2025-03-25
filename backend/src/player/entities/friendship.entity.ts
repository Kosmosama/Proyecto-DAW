import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Player } from './player.entity';

export enum FriendshipStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
}

@Entity()
export class Friendship {
    @PrimaryColumn({ name: "id_player1" })
    idPlayer1: number;

    @PrimaryColumn({ name: "id_player2" })
    idPlayer2: number;

    @ManyToOne(() => Player, (player) => player.id, { onDelete: "CASCADE" })
	@JoinColumn({ name: "id_player1" })
    player1: Player;

    @ManyToOne(() => Player, (player) => player.id, { onDelete: "CASCADE" })
	@JoinColumn({ name: "id_player2" })
    player2: Player;
    
	@CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @Column({ type: "enum", enum: FriendshipStatus })
    status: FriendshipStatus;
}
