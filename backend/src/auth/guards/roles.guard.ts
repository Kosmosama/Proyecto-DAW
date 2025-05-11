import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { RolesMetadata } from '../types/roles-metadata.type';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const meta = this.reflector.getAllAndOverride<RolesMetadata>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!meta) return true;

        const { roles, selfParam = 'playerId' } = meta;
        const request = context.switchToHttp().getRequest();
        const player = request.user;

        if (!roles) return true;
        if (!player?.role) return false;

        const parsedPlayerId = request.params[selfParam] ? parseInt(request.params[selfParam], 10) : null;

        for (const role of roles) {
            if (role === Role.SELF) {
                if (parsedPlayerId !== null && player.id === parsedPlayerId) {
                    return true;
                }
            } else if (player.role === role) {
                return true;
            }
        }

        return false;
    }
}
