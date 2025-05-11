import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Player } from './player.entity';
import { FriendshipStatus } from '../enums/friendship-status.enum';

@Entity()
export class Friendship {
    @PrimaryColumn({ name: "sender_id" })
    senderId: number;

    @PrimaryColumn({ name: "receiver_id" })
    receiverId: number;

    @ManyToOne(() => Player, (player) => player.id, { onDelete: "CASCADE" })
	@JoinColumn({ name: "sender_id" })
    sender: Player;

    @ManyToOne(() => Player, (player) => player.id, { onDelete: "CASCADE" })
	@JoinColumn({ name: "receiver_id" })
    receiver: Player;
    
	@CreateDateColumn({ name: "created_at" })
    updatedAt: Date;

    @Column({ type: "enum", enum: FriendshipStatus })
    status: FriendshipStatus;

    @BeforeInsert()
    @BeforeUpdate()
    async updateDate() {
        this.updatedAt = new Date();
    }
}
