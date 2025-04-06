import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Player } from 'src/player/decorators/player.decorator';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { TokenResponse } from './interfaces/token-response.interface';

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

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google/login')
    async googleLogin() {
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleCallback(@Player() player: PlayerPublic, @Res() res): Promise<void> {
        const response = await this.authService.login(player);
        res.redirect(`http://localhost:3000?token=${response.accessToken}&refreshToken=${response.refreshToken}`);
    }

    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    refresh(@Player() player): Promise<TokenResponse> {
        return this.authService.refreshToken(player);
    }
}
