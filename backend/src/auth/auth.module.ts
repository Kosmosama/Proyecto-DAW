import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PlayerModule } from 'src/player/player.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { IsEmailUniqueConstraint } from './validators/is-email-unique.validator';
import { JwtWsGuard } from './guards/jwt-ws.guard';

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
    providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy, LocalStrategy, RefreshJwtStrategy, IsEmailUniqueConstraint, JwtWsGuard],
    controllers: [AuthController],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }