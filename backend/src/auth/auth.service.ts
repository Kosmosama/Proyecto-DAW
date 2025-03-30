import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from 'src/player/entities/player.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
        private readonly jwtService: JwtService
    ) {}

    async register(registerDto: RegisterDto): Promise<{ id: number; username: string }> {
        try {
            const existingPlayer = await this.playerRepository.findOneBy({ name: registerDto.username });
            if (existingPlayer) {
                throw new UnauthorizedException('Username already exists.');
            }

            const hashedPassword = await bcrypt.hash(registerDto.password, 12);

            const newPlayer = this.playerRepository.create({ 
                name: registerDto.username,
                passwordHash: hashedPassword,
            });

            const savedPlayer = await this.playerRepository.save(newPlayer);

            return { id: savedPlayer.id, username: savedPlayer.name };
        } catch (error) {
            console.error("Error registering player:", error.message);
            throw new HttpException("An error occurred while registering the player.", 500);
        }
    }

    async login(loginDto: LoginDto): Promise<{ access_token: string; refresh_token: string }> {
        try {
            const player = await this.validatePlayer(loginDto);
            if (!player) {
                throw new UnauthorizedException('Invalid credentials.');
            }

            const payload = { username: player.name, id: player.id };
            const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
            const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

            return { access_token: accessToken, refresh_token: refreshToken };
        } catch (error) {
            console.error("Login error:", error.message);
            throw new UnauthorizedException('Invalid credentials.');
        }
    }

    async refresh(refreshToken: string): Promise<{ access_token: string }> {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken);
            const newAccessToken = this.jwtService.sign({ username: payload.username, id: payload.id }, { expiresIn: '1h' });
            return { access_token: newAccessToken };
        } catch (error) {
            console.error("Refresh token error:", error.message);
            throw new UnauthorizedException('Invalid or expired refresh token.');
        }
    }

    private async validatePlayer(loginDto: LoginDto): Promise<Partial<Player>> {
        try {
            const player = await this.playerRepository.findOneBy({ name: loginDto.username });

            if (player && await bcrypt.compare(loginDto.password, player.passwordHash)) {
                return { id: player.id, name: player.name };
            } else {
                throw new UnauthorizedException('Invalid credentials.');
            }
        } catch (error) {
            console.error("Validation error:", error.message);
            throw new UnauthorizedException('Invalid credentials.');
        }
    }
}
