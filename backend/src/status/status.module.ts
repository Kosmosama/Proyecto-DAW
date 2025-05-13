import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PlayerModule } from 'src/player/player.module';
import { StatusGateway } from './status.gateway';
import { StatusService } from './status.service';

@Module({
    imports: [PlayerModule, RedisModule, AuthModule],
    providers: [StatusGateway, StatusService],
})
export class StatusModule { }
