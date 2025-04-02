import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './interfaces/login-response.interface';
import { RefreshResponse } from './interfaces/refresh-response.interface';
import { Public } from './decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Player } from 'src/player/decorators/player.decorator';

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

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
        return { message: 'Redirecting to Google...' };
    }

    // @Get('google/redirect')
    // @UseGuards(AuthGuard(GoogleOauth))
    // async googleAuthRedirect(@Player() player: PlayerPublic) {
    //     // return this.authService.login(player);
    //     console.log(player);
    // }

    // @HttpCode(HttpStatus.OK)
    // @Post('refresh')
    // refresh(@Body('refresh_token') refreshToken: string): Promise<RefreshResponse> {
    //     return this.authService.refresh(refreshToken);
    // }
}
