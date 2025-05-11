import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Player } from 'src/player/decorators/player.decorator';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { TokenResponse } from './interfaces/token-response.interface';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';

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
    @ApiOperation({ summary: 'Login with username and password' })
    @ApiResponse({ status: 200, description: 'Login successful, returns access and refresh tokens.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    login(@Player() player: PlayerPrivate): Promise<TokenResponse> {
        return this.authService.login(player);
    }
    
    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new player' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Player successfully registered.' })
    @ApiResponse({ status: 400, description: 'Invalid registration data.' })
    register(@Body() registerDto: RegisterDto): Promise<PlayerPublic> {
        return this.authService.register(registerDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logout')
    @ApiOperation({ summary: 'Logout the current player' })
    @ApiResponse({ status: 200, description: 'Logout successful.' })
    logout(@Player() player: PlayerPrivate): Promise<void> {
        return this.authService.logout(player);
    }

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google/login')
    @ApiOperation({ summary: 'Start Google OAuth login flow' })
    @ApiResponse({ status: 200, description: 'Redirect to Google OAuth login.' })
    async googleLogin() {
        // Everything is handled by the GoogleAuthGuard
    }

    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    @ApiOperation({ summary: 'Callback after Google OAuth login' })
    @ApiResponse({ status: 200, description: 'Redirect to frontend with tokens.' })
    @ApiResponse({ status: 400, description: 'Error with Google login callback.' })
    async googleCallback(@Player() player: PlayerPrivate, @Res() res): Promise<void> {
        const response = await this.authService.login(player);
        res.redirect(`http://localhost:4200/auth/oauth-callback?token=${response.accessToken}&refreshToken=${response.refreshToken}`); // Redirect to frontend page with tokens
    }

    @Public()
    @UseGuards(GithubAuthGuard)
    @Get('github/login')
    @ApiOperation({ summary: 'Start GitHub OAuth login flow' })
    @ApiResponse({ status: 200, description: 'Redirect to GitHub OAuth login.' })
    async githubLogin() {
        // Everything is handled by the GithubAuthGuard
    }

    @UseGuards(GithubAuthGuard)
    @Get('github/callback')
    @ApiOperation({ summary: 'Callback after GitHub OAuth login' })
    @ApiResponse({ status: 200, description: 'Redirect to frontend with tokens.' })
    @ApiResponse({ status: 400, description: 'Error with GitHub login callback.' })
    async githubCallback(@Player() player: PlayerPrivate, @Res() res): Promise<void> {
        const response = await this.authService.login(player);
        res.redirect(`http://localhost:4200/auth/oauth-callback?token=${response.accessToken}&refreshToken=${response.refreshToken}`); // Redirect to frontend page with tokens
    }

    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    @ApiResponse({ status: 200, description: 'Refresh successful, returns new tokens.' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
    refresh(@Player() player: PlayerPrivate): Promise<TokenResponse> {
        return this.authService.refreshToken(player);
    }
}
