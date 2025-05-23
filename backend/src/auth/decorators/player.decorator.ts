import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';

export const Player = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): PlayerPrivate => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);