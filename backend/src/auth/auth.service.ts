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

            const hashedPassword = await bcrypt.hash(registerDto.password, 10);

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

    async login(loginDto: LoginDto): Promise<{ access_token: string }> {
        try {
            const player = await this.validatePlayer(loginDto);
            if (!player) {
                throw new UnauthorizedException('Invalid credentials.');
            }

            const payload = { username: player.name, id: player.id };
            return { access_token: this.jwtService.sign(payload) };
        } catch (error) {
            console.error("Login error:", error.message);
            throw new UnauthorizedException('Invalid credentials.');
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
