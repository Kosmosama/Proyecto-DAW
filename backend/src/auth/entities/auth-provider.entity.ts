import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Player } from "../../player/entities/player.entity";

@Entity()
export class AuthProvider {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    provider: 'google' | 'github' | 'local';

    @Column()
    providerId: string;

    @ManyToOne(() => Player, (player) => player.authProviders, { onDelete: 'CASCADE' })
    player: Player;
}