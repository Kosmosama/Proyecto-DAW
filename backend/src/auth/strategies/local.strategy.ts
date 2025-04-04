import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService,) {
        super({
            usernameField: 'email',
            passwordField: 'password',
        });
    }

    validate(email: string, password: string): Promise<PlayerPublic> {
        if (!email) throw new UnauthorizedException('Email is required.');
        if (!password) throw new UnauthorizedException('Password is required.');

        return this.authService.validatePlayer({ email, password } as LoginDto);
    }
}
