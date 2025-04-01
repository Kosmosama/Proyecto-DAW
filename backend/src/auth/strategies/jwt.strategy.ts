import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PlayerResponse } from 'src/player/interfaces/player-response.interface';
import { PlayerService } from 'src/player/player.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly playerService: PlayerService,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    /**
     * Validate JWT and extract player info.
     * @param {JwtPayload} payload The decoded JWT payload.
     * @returns {PlayerResponse} The player details if valid.
     * @throws {UnauthorizedException} If the player is not found or the token is invalid.
     */
    async validate(payload: JwtPayload): Promise<PlayerResponse> {
        const player = await this.playerService.findOne(payload.id);
        if (!player) {
            throw new UnauthorizedException('Invalid token');
        }
        return player;
    }
}
