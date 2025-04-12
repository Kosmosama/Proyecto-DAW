import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]);
        const player = context.switchToHttp().getRequest().user;

        if (!requiredRoles) return true;
        if (!player.role) return false;
        if (requiredRoles.includes(player.role)) return true;
        return false;
    }
}