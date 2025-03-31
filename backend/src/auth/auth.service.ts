import { ConflictException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
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

    async login(loginDto: LoginDto): Promise<{ access_token: string; refresh_token: string }> {
        const player = await this.validatePlayer(loginDto);
        if (!player) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        const payload = { username: player.username, id: player.id };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return { access_token: accessToken, refresh_token: refreshToken };
    }

    async refresh(refreshToken: string): Promise<{ access_token: string }> {
        const payload = await this.jwtService.verifyAsync(refreshToken);
        const newAccessToken = this.jwtService.sign({ username: payload.username, id: payload.id }, { expiresIn: '1h' });
        return { access_token: newAccessToken };
    }

    private async validatePlayer(loginDto: LoginDto): Promise<Partial<Player>> {
        const player = await this.playerRepository.findOneBy({ username: loginDto.username });

        if (player && await bcrypt.compare(loginDto.password, player.password)) {
            return { id: player.id, username: player.username };
        } else {
            throw new UnauthorizedException('Invalid credentials.');
        }
    }
}
