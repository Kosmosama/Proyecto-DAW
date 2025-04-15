import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SocketWithUser } from 'src/status/interfaces/socket-with-user.interface';

export const PlayerWs = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const client: SocketWithUser = context.switchToWs().getClient();
        return client.user;
    },
);
