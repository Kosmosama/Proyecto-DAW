import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';
import { PlayerService } from 'src/player/player.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from './enums/role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TokenResponse } from './interfaces/token-response.interface';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { Socket } from 'socket.io';

@Injectable()
export class AuthService {
    constructor(
        private readonly playerService: PlayerService,
        private readonly jwtService: JwtService
    ) { }

    /**
     * Registers a new player.
     * @param {RegisterDto} registerDto Data transfer object containing username and password.
     * @returns {PlayerPublic} The newly created player's ID and username.
     * @throws {ConflictException} If the username is already taken.
     */
    async register(registerDto: RegisterDto): Promise<PlayerPublic> {
        const newPlayer = await this.playerService.createUser(registerDto);
        return { id: newPlayer.id, username: newPlayer.username, tag: newPlayer.tag };
    }

    /**
     * Logs in a player and generates JWT tokens.
     * @param {PlayerPublic} player The player object containing ID and username.
     * @returns {TokenResponse} Object containing access and refresh tokens.
     */
    async login(player: PlayerPublic): Promise<TokenResponse> {
        const playerPrivateInfo = await this.playerService.findOnePrivate(player.id);
        const { accessToken, refreshToken } = await this.generateTokens(player.id, playerPrivateInfo.role);
        const hashedRefreshToken = await this.setRefreshToken(player.id, refreshToken);
        return { accessToken, refreshToken: hashedRefreshToken! };
    }

    /**
     * Logs out a player by clearing their refresh token.
     * @param {PlayerPublic} player The player object containing ID and username.
     * @returns {Promise<void>} No return value.
     */
    async logout(player: PlayerPrivate): Promise<void> {
        await this.clearRefreshToken(player.id);
    }

    /**
     * Refreshes the JWT tokens for a player.
     * @param {PlayerPublic} player The player object containing ID and username.
     * @returns {TokenResponse} Object containing new access and refresh tokens.
     */
    async refreshToken(player: PlayerPublic): Promise<TokenResponse> {
        const playerPrivateInfo = await this.playerService.findOnePrivate(player.id);
        const { accessToken, refreshToken } = await this.generateTokens(player.id, playerPrivateInfo.role);
        const hashedRefreshToken = await this.setRefreshToken(player.id, refreshToken);
        return { accessToken, refreshToken: hashedRefreshToken! };
    }

    /**
     * Validates a raw JWT access token and returns the player.
     * @param {string} token The JWT access token.
     * @returns {Promise<PlayerPrivate>} The authenticated player's full private info.
     * @throws {UnauthorizedException} If the token is invalid or expired.
     */
    async validateAccessToken(token: string): Promise<PlayerPrivate> {
        try {
            const payload = this.jwtService.verify<JwtPayload>(token, {
                secret: process.env.JWT_SECRET, // #TODO Change for configService later
            });
            const player = await this.playerService.findOnePrivate(payload.id);
            if (!player) throw new UnauthorizedException('Invalid token');
            return player;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    /**
     * Validates a Google user and retrieves or creates a player.
     * @param {any} profile The Google profile object.
     * @returns {PlayerPublic} The player's ID, username, and email.
     * @throws {Error} If the Google account has no email.
     */
    async validateGoogleUser(profile: any): Promise<PlayerPublic> { // Google profile interface
        const { displayName, emails } = profile;
        const email = emails?.[0]?.value;
        if (!email) throw new Error("Google account has no email");

        let player: any;
        try {
            player = await this.playerService.findOneBy({ email });
        } catch {
            player = await this.playerService.createUser({
                username: displayName,
                email,
                password: '',
            });
        }

        return { id: player.id, username: player.username, tag: player.tag };
    }

    /**
     * Validates a GitHub user and retrieves or creates a player.
     * @param {any} profile The GitHub profile object.
     * @returns {PlayerPublic} The player's ID, username, and email.
     * @throws {Error} If the GitHub account has no email.
     */
    async validateGithubUser(profile: any): Promise<PlayerPublic> {
        const { username, emails } = profile;
        const email = emails?.[0]?.value;
        if (!email) throw new Error("GitHub account has no email");

        let player: any;
        try {
            player = await this.playerService.findOneBy({ email });
        } catch {
            player = await this.playerService.createUser({
                username,
                email,
                password: '',
            });
        }

        return { id: player.id, username: player.username, tag: player.tag };
    }

    /**
     * Validates a refresh token and retrieves player information.
     * @param {number} playerId The player's ID.
     * @param {string} refreshToken The refresh token to validate.
     * @returns {PlayerPublic} The player's public information.
     * @throws {UnauthorizedException} If the refresh token is invalid or expired.
     */
    async validateRefreshToken(playerId: number, refreshToken: string): Promise<PlayerPublic> {
        const isValid = await this.playerService.validateRefreshToken(playerId, refreshToken);
        if (!isValid) throw new UnauthorizedException('Invalid or expired refresh token.');

        const player = await this.playerService.findOneBy({ id: playerId }, true, ['id', 'username', 'tag', 'email']);
        return { id: player.id, username: player.username, tag: player.tag };
    }

    /**
     * Validates a player's credentials.
     * @param {LoginDto} login The login data transfer object containing email and password.
     * @returns {PlayerPublic} The player's public information.
     * @throws {UnauthorizedException} If the credentials are invalid.
     */
    async validatePlayer(login: LoginDto): Promise<PlayerPublic> {
        const player = await this.playerService.findOneBy({ email: login.email }, true, ['id', 'username', 'tag', 'password']);
        const isMatch = await bcrypt.compare(login.password, player.password);

        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        return { id: player.id, username: player.username, tag: player.tag };
    }

    /**
     * Extracts the JWT token from the socket connection.
     * @param {Socket} client The socket client object.
     * @returns {string} The extracted token.
     * @throws {Error} If the token is missing or invalid.
     */
    extractToken(client: Socket): string {
        const token = client.handshake.auth?.token;
        if (!token || typeof token !== 'string') {
            throw new Error('Missing or invalid token');
        }
        console.log('Extracted token:', token);
        return token;
    }

    /**
     * Authenticates a socket client using JWT.
     * @param {Socket} client The socket client object.
     * @returns {Promise<PlayerPrivate>} The authenticated player's private information.
     * @throws {Error} If the token is missing or invalid.
     */
    async authenticateClient(client: Socket): Promise<PlayerPrivate> {
        // const token = client.handshake.headers.authorization?.split(' ')[1];
        const token = client.handshake.auth.token?.replace('Bearer ', '');

        if (!token) throw new Error('No token provided');

        const payload = this.verifyJwt(token);
        return this.validatePayload(payload);
    }

    /**
     * Verifies a JWT token and returns the payload.
     * @param {string} token The JWT token to verify.
     * @returns {JwtPayload} The decoded JWT payload.
     * @throws {Error} If the token is invalid or expired.
     */
    private verifyJwt(token: string): JwtPayload {
        try {
            return this.jwtService.verify<JwtPayload>(token);
        } catch {
            throw new Error('Invalid token');
        }
    }

    /**
     * Validates the JWT payload and retrieves the player's private information.
     * @param {JwtPayload} payload The decoded JWT payload.
     * @returns {Promise<PlayerPrivate>} The player's private information.
     * @throws {Error} If the player is not found.
     */
    private async validatePayload(payload: JwtPayload): Promise<PlayerPrivate> {
        const player = await this.playerService.findOnePrivate(payload.id);
        if (!player) {
            throw new Error('Player not found');
        }
        return player;
    }

    /**
     * Generates JWT tokens for a player.
     * @param {number} playerId The player's ID.
     * @returns {Promise<TokenResponse>} Object containing access and refresh tokens.
     */
    private async generateTokens(playerId: number, playerRole: Role): Promise<TokenResponse> {
        const payload: JwtPayload = {
            id: playerId,
            role: playerRole,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { expiresIn: '1h' }),
            this.jwtService.signAsync(payload, { expiresIn: '7d' }),
        ]);

        return { accessToken, refreshToken };
    }

    /**
     * Sets a new refresh token for a player.
     * @param {number} playerId The player's ID.
     * @param {string} refreshToken The new refresh token to set.
     * @returns {Promise<string>} The hashed refresh token.
     */
    private async setRefreshToken(playerId: number, refreshToken: string): Promise<string> {
        return (await this.playerService.updateRefreshToken(playerId, refreshToken))!;
    }

    /**
     * Clears the refresh token for a player.
     * @param {number} playerId The player's ID.
     * @returns {Promise<void>} No return value.
     */
    private async clearRefreshToken(playerId: number): Promise<void> {
        await this.playerService.updateRefreshToken(playerId, null);
    }
}
