import { Module } from '@nestjs/common';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { Friendship } from './entities/friendship.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Player, Friendship]),
    ],
    controllers: [PlayerController],
    providers: [PlayerService],
})
export class PlayerModule { }
