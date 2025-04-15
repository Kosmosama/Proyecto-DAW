import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PlayerService } from 'src/player/player.service';
import { SocketWithUser } from 'src/status/interfaces/socket-with-user.interface';

@Injectable()
export class JwtWsGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly playerService: PlayerService,
        private readonly configService: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: SocketWithUser = context.switchToWs().getClient();
        const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) throw new UnauthorizedException('Missing token');

        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            const player = await this.playerService.findOne(payload.id);
            if (!player) throw new UnauthorizedException('Invalid player');

            client.user = player;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
