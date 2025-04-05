import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponse } from './interfaces/token-response.interface';
import { Public } from './decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Player } from 'src/player/decorators/player.decorator';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';

@Public()
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Public()
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Player() player: PlayerPublic): Promise<TokenResponse> {
        return this.authService.login(player);
    }

    @Post('register')
    register(@Body() registerDto: RegisterDto): Promise<PlayerPublic> {
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

    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    refresh(@Player() player): Promise<TokenResponse> {
        return this.authService.refreshToken(player);
    }
}
