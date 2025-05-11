import { Module } from '@nestjs/common';
import { StatusGateway } from './status.gateway';
import { PlayerService } from '../player/player.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../player/entities/player.entity';
import { Friendship } from '../player/entities/friendship.entity';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
    imports: [
        TypeOrmModule.forFeature([Player, Friendship]),
        RedisModule
    ],
    providers: [StatusGateway, PlayerService],
})
export class StatusModule { }
