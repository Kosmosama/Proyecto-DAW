import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

export const PlayerIdWs = createParamDecorator(
    (data: unknown, context: ExecutionContext): number => {
        const client: Socket = context.switchToWs().getClient();
        const playerId = client.data.playerId;

        console.log(playerId);

        if (!playerId) {
            throw new Error('Player ID not found in client data.');
        }

        return playerId;
    },
);