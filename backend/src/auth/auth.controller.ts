import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './interfaces/login-response.interface';
import { RefreshResponse } from './interfaces/refresh-response.interface';
import { Public } from './decorators/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
        return this.authService.login(loginDto);
    }

    @Post('register')
    register(@Body() registerDto: LoginDto): Promise<PlayerPublic> {
        return this.authService.register(registerDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    refresh(@Body('refresh_token') refreshToken: string): Promise<RefreshResponse> {
        return this.authService.refresh(refreshToken);
    }
}
