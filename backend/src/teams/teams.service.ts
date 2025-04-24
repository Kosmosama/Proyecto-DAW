import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { PlayerService } from 'src/player/player.service';

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
        private readonly playerService: PlayerService,
    ) { }

    async create(playerId: number, name: string, data: any): Promise<Team> {
        const player = await this.playerService.findOnePrivate(playerId);
        if (!player) throw new NotFoundException('Player not found');

        const team = this.teamRepository.create({ name, data, player });
        return this.teamRepository.save(team);
    }

    async findAllByPlayer(playerId: number): Promise<Team[]> {
        return this.teamRepository.find({
            where: { player: { id: playerId } },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(playerId: number, teamId: number): Promise<Team> {
        const team = await this.teamRepository.findOne({
            where: { id: teamId, player: { id: playerId } },
        });
        if (!team) throw new NotFoundException('Team not found');
        return team;
    }

    async delete(playerId: number, teamId: number): Promise<void> {
        const result = await this.teamRepository.delete({ id: teamId, player: { id: playerId } });
        if (!result.affected) throw new NotFoundException('Team not found or not owned by player');
    }
}
