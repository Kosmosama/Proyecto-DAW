import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { PlayerService } from 'src/player/player.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'wsjwt') {
    constructor(
        private readonly playerService: PlayerService,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {
                    const authHeader = req?.auth.token;
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        return authHeader.split(' ')[1];
                    }

                    return null;
                },
            ]),
            secretOrKey: configService.get<string>('JWT_SECRET')!,
        });
    }

    async validate(payload: JwtPayload): Promise<PlayerPrivate> {
        const { id } = payload;
        try {
            const player = await this.playerService.findOnePrivate(id);
            if (!player) throw new WsException('Unauthorized');
            return player;
        } catch (error) {
            throw new WsException('Unauthorized');
        }
    }
}
