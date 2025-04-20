import { Module } from '@nestjs/common';
import { PlayerService } from '../player/player.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../player/entities/player.entity';
import { Friendship } from '../player/entities/friendship.entity';
import { GameGateway } from './game.gateway';

@Module({
    imports: [TypeOrmModule.forFeature([Player, Friendship])],
    providers: [GameGateway, PlayerService],
})
export class GameModule { }
