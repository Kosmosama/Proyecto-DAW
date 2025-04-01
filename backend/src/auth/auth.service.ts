import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Player } from 'src/player/entities/player.entity';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponse } from './interfaces/login-response.interface';
import { RefreshResponse } from './interfaces/refresh-response.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
        private readonly jwtService: JwtService
    ) {}

    /**
     * Registers a new player.
     * @param {RegisterDto} registerDto Data transfer object containing username and password.
     * @returns {PlayerPublic} The newly created player's ID and username.
     * @throws {ConflictException} If the username is already taken.
     */
    async register(registerDto: RegisterDto): Promise<PlayerPublic> {
        const existingPlayer = await this.playerRepository.findOneBy({ username: registerDto.username });
        if (existingPlayer) throw new ConflictException('Username already exists.');

        const hashedPassword = await bcrypt.hash(registerDto.password, 12);

        const newPlayer = this.playerRepository.create({ 
            ...registerDto,
            password: hashedPassword,
        });

        const savedPlayer = await this.playerRepository.save(newPlayer);

        return { id: savedPlayer.id, username: savedPlayer.username };
    }

    /**
     * Authenticates a player and returns access and refresh tokens.
     * @param {LoginDto} loginDto Data transfer object containing login credentials.
     * @returns {LoginResponse} Object containing access and refresh tokens.
     * @throws {UnauthorizedException} If credentials are invalid.
     */
    async login(loginDto: LoginDto): Promise<LoginResponse> {
        const player = await this.validatePlayer(loginDto);
        if (!player) throw new UnauthorizedException('Invalid credentials.');

        const payload = { username: player.username, id: player.id };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return { access_token: accessToken, refresh_token: refreshToken };
    }

    /**
     * Generates a new access token using a refresh token.
     * @param {string} refreshToken The refresh token provided during login.
     * @returns {RefreshResponse} Object containing the new access token.
     * @throws {UnauthorizedException} If the refresh token is invalid or expired.
     */
    async refresh(refreshToken: string): Promise<RefreshResponse> {
        const payload = await this.jwtService.verifyAsync(refreshToken);
        const newAccessToken = this.jwtService.sign({ username: payload.username, id: payload.id }, { expiresIn: '1h' });
        return { access_token: newAccessToken };
    }

    /**
     * Validates player credentials.
     * @param {LoginDto} loginDto Data transfer object containing login credentials.
     * @returns {PlayerPublic} Partial player data if credentials are valid.
     * @throws {UnauthorizedException} If credentials are invalid.
     */
    private async validatePlayer(loginDto: LoginDto): Promise<PlayerPublic> {
        const player = await this.playerRepository.findOneBy({ username: loginDto.username });

        if (player && await bcrypt.compare(loginDto.password, player.password)) {
            return { id: player.id, username: player.username };
        } else {
            throw new UnauthorizedException('Invalid credentials.');
        }
    }
}
