import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Player } from "../../player/entities/player.entity";
import { Provider } from "../enums/provider.enum";

@Entity()
export class AuthProvider {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: Provider })
    provider: Provider;

    @Column()
    providerId: string;

    @ManyToOne(() => Player, (player) => player.authProviders, { onDelete: 'CASCADE' })
    player: Player;
}