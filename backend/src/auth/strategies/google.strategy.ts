import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
            scope: ['profile', 'email'],
            prompt: 'select_account'
        });
    }

     authorizationParams(): Record<string, string> {
        return {
            prompt: 'select_account'
        };
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
        const user = await this.authService.validateGoogleUser(profile);
        done(null, user);
    }
}
