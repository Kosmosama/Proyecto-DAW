import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PlayerModule } from 'src/player/player.module';
import { TeamsModule } from 'src/teams/teams.module';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
    imports: [AuthModule, RedisModule, PlayerModule, TeamsModule],
    providers: [GameGateway, GameService],
})
export class GameModule { }
