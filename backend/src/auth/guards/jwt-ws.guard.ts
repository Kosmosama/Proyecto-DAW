import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { Socket } from 'socket.io';

@Injectable()
export class JwtWsGuard implements CanActivate {
    constructor(private readonly authService: AuthService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();

        try {
            const token = this.authService.extractToken(client);
            const player = await this.authService.validateAccessToken(token);
            client.data.player = player;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or missing WebSocket token');
        }
    }
}