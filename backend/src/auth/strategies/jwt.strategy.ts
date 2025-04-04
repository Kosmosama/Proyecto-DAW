import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { PlayerService } from 'src/player/player.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly playerService: PlayerService,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')!,
        });
    }

    /**
     * Validate JWT and extract player info.
     * @param {JwtPayload} payload The decoded JWT payload.
     * @returns {PlayerPublic} The player details if valid.
     * @throws {UnauthorizedException} If the player is not found or the token is invalid.
     */
    async validate(payload: JwtPayload): Promise<PlayerPublic> {
        const player = await this.playerService.findOne(payload.id);
        if (!player) {
            throw new UnauthorizedException('Invalid token');
        }
        return player;
    }
}
