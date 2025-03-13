import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from './player.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlayerService {
    constructor(
        @InjectRepository(Player)
        private playerRepository: Repository<Player>,
    ) { }

    findAll(): Promise<Player[]> {
        return this.playerRepository.find();
    }

    findOne(id: number): Promise<Player | null> {
        return this.playerRepository.findOneBy({ id });
    }

    async remove(id: number): Promise<void> {
        await this.playerRepository.delete(id);
    }
}
