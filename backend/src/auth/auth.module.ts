import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PlayerModule } from 'src/player/player.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PlayerService } from 'src/player/player.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
    imports: [
        PlayerModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' },
            }),
        }),
    ],
    providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy, PlayerService, LocalStrategy, RefreshJwtStrategy],
    controllers: [AuthController],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }