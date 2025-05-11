import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './auth/guards/jwt-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { redisAsyncConfig } from './config/redis.config';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { GameModule } from './game/game.module';
import { PlayerModule } from './player/player.module';
import { StatusModule } from './status/status.module';
import { TeamsModule } from './teams/teams.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
        RedisModule.forRootAsync(redisAsyncConfig),
        PlayerModule,
        StatusModule,
        GameModule,
        AuthModule,
        TeamsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        JwtStrategy,
        {
            provide: 'APP_GUARD',
            useClass: JwtGuard,
        },
    ],
})
export class AppModule { }
