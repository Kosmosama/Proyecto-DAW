import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PlayerModule } from 'src/player/player.module';
import { MatchmakingService } from './matchmaking.service';
import { RealtimeGateway } from './realtime.gateway';
import { StatusService } from './status.service';
import { TeamsModule } from 'src/teams/teams.module';
import { BattleService } from './battle.service';
import { GameService } from './game.service';

@Module({
    imports: [PlayerModule, RedisModule, AuthModule, TeamsModule],
    providers: [RealtimeGateway, StatusService, MatchmakingService, GameService],
})
export class RealtimeModule { }
