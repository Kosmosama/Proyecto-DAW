import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './auth/guards/jwt-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { RedisFlushService } from './common/redis-flush.service';
import { redisAsyncConfig } from './config/redis.config';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { PlayerModule } from './player/player.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TeamsModule } from './teams/teams.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
        RedisModule.forRootAsync(redisAsyncConfig),
        PlayerModule,
        RealtimeModule,
        AuthModule,
        TeamsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        JwtStrategy,
        RedisFlushService,
        {
            provide: 'APP_GUARD',
            useClass: JwtGuard,
        },
    ],
})
export class AppModule { }
