import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PlayerModule } from 'src/player/player.module';
import { MatchmakingService } from './matchmaking.service';
import { RealtimeGateway } from './realtime.gateway';
import { StatusService } from './status.service';

@Module({
    imports: [PlayerModule, RedisModule, AuthModule],
    providers: [RealtimeGateway, StatusService, MatchmakingService],
})
export class RealtimeModule { }
