import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './auth/guards/jwt-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { GameModule } from './game/game.module';
import { PlayerModule } from './player/player.module';
import { StatusModule } from './status/status.module';
import { TeamsModule } from './teams/teams.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT'),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_NAME'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: configService.get<string>('NODE_ENV') !== 'production',
            }),
        }),
        PlayerModule,
        StatusModule,
        GameModule,
        AuthModule,
        TeamsModule,
        RedisModule
    ],
    controllers: [AppController],
    providers: [
        {
            provide: 'APP_GUARD',
            useClass: JwtGuard,
        },
        JwtStrategy,
        AppService
    ],
})
export class AppModule { }
