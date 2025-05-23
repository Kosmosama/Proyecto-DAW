import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';

export const PlayerWs = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): PlayerPrivate => {
        const client: Socket = ctx.switchToWs().getClient();
        const player = (client.handshake as { user?: PlayerPrivate }).user;
        if (!player) {
            throw new Error('Player not found in WebSocket handshake');
        }
        return player;
    },
);
