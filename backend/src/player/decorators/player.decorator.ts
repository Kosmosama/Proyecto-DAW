import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlayerPublic } from '../interfaces/player-public.interface';

export const Player = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): PlayerPublic => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);