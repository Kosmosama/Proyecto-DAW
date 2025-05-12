import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesMetadata } from '../types/roles-metadata.type';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const meta = this.reflector.getAllAndOverride<RolesMetadata>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!meta) return true;

        const { roles } = meta;
        const request = context.switchToHttp().getRequest();
        const player = request.user;

        if (!roles) return true;
        if (!player?.role) return false;

        return roles.includes(player.role);
    }
}
