import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
    Strategy,
    'refresh-jwt',
) {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
            ignoreExpiration: false,
            passReqToCallback: true,
        });
    }

    // #TODO Maybe we can get plater with @Player decorator instead of using req, have to try it
    validate(req: Request, payload: JwtPayload) {
        const refreshToken = (req.get('authorization') ?? '').replace('Bearer', '').trim();
        const userId = payload.id;
        return this.authService.validateRefreshToken(userId, refreshToken);
    }
}