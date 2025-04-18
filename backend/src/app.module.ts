import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PlayerModule } from './player/player.module';
import { JwtGuard } from './auth/guards/jwt-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { StatusModule } from './status/status.module';
import { StatusGateway } from './status/status.gateway';

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
                synchronize: true, // #WARNING: Set to false on production
            }),
        }),
        PlayerModule,
        StatusModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [
        AppService, 
        StatusGateway,
        {
            provide: 'APP_GUARD',
            useClass: JwtGuard,
        },
        JwtStrategy,
    ],
})
export class AppModule { }
