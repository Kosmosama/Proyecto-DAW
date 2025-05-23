import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtWsGuard extends AuthGuard('wsjwt') {
    getRequest(context: ExecutionContext) {
        return context.switchToWs().getClient().handshake;
    }
}
