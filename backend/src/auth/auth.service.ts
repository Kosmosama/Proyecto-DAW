import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Player } from 'src/player/entities/player.entity';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TokenResponse } from './interfaces/token-response.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
        private readonly jwtService: JwtService
    ) { }

    /**
     * Registers a new player.
     * @param {RegisterDto} registerDto Data transfer object containing username and password.
     * @returns {PlayerPublic} The newly created player's ID and username.
     * @throws {ConflictException} If the username is already taken.
     */
    async register(registerDto: RegisterDto): Promise<PlayerPublic> {
        const existingPlayer = await this.playerRepository.findOneBy({ username: registerDto.username });
        if (existingPlayer) throw new ConflictException('Username already exists.');

        const newPlayer = this.playerRepository.create({
            ...registerDto,
        });

        const savedPlayer = await this.playerRepository.save(newPlayer);

        return { id: savedPlayer.id, username: savedPlayer.username };
    }

    async login(player: PlayerPublic): Promise<TokenResponse> {
        const { accessToken, refreshToken } = await this.generateTokens(player.id);

        // #TODO Save refresh token in the database | should refreshToken be returned?

        return { accessToken, refreshToken };
    }

    async refreshToken(player: Player): Promise<TokenResponse> {
        const { accessToken, refreshToken } = await this.generateTokens(player.id);

        // #TODO Save refresh token in the database | should refreshToken be returned?

        return { accessToken, refreshToken };
    }

    /**
     * Validates a Google user and creates a new player if they don't exist.
     * @param {any} profile The Google user profile.
     * @returns {Promise<PlayerPublic>} The player's ID and username.
     */
    async validateGoogleUser(profile: any): Promise<PlayerPublic> {
        const { id, displayName, emails } = profile;
        let player = await this.playerRepository.findOneBy({ username: id });

        if (!player) { //#TODO This might need to be changed
            player = this.playerRepository.create({
                username: id,
                password: id,
            });
            await this.playerRepository.save(player);
        }

        return { id: player.id, username: player.username };
    }

    async validateRefreshToken(playerId: number, refreshToken: string): Promise<PlayerPublic> {
        const player = await this.playerRepository.findOneBy({ id: playerId });
        if (!player) throw new UnauthorizedException('Player not found!');

        // #TODO Check if refresh token is valid in db

        return { id: player.id, username: player.username, email: player.email }; // #TODO Should we return something?
    }

    async validatePlayer(login: LoginDto): Promise<PlayerPublic> {
        const player = await this.playerRepository.findOneBy({ email: login.email });
        if (!player) throw new UnauthorizedException('Player not found!');

        console.log("Validated player: " + player.email);

        if (player && await bcrypt.compare(login.password, player.password)) {
            return { id: player.id, username: player.username };
        } else {
            throw new UnauthorizedException('Invalid credentials.');
        }
    }

    private async generateTokens(playerId: number): Promise<TokenResponse> {
        const payload: JwtPayload = { id: playerId };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { expiresIn: '1h' }),
            this.jwtService.signAsync(payload, { expiresIn: '7d' }),
        ]);

        return { accessToken, refreshToken } as TokenResponse;
    }
}
