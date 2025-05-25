import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Generation, Generations } from '@pkmn/data';
import { Dex, PokemonSet } from '@pkmn/dex';
import { Sets } from '@pkmn/sets';
import { TeamValidator } from '@pkmn/sim';
import { PlayerService } from 'src/player/player.service';
import { Repository } from 'typeorm';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamService {
    private readonly gens = new Generations(Dex);

    constructor(
        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
        private readonly playerService: PlayerService,
    ) { }

    async create(playerId: number, dto: CreateTeamDto): Promise<Team> {
        const player = await this.playerService.findOnePrivate(playerId);
        if (!player) throw new NotFoundException('Player not found');

        const { name, data } = dto;
        const { team: rawData, format = 'gen9ou', strict = true } = data;

        const parsedTeam = await this.validateAndParseTeam(rawData, format, strict);

        const newTeam = this.teamRepository.create({
            name,
            data: parsedTeam,
            format,
            player,
        });

        return this.teamRepository.save(newTeam);
    }

    async update(playerId: number, teamId: number, dto: UpdateTeamDto): Promise<void> {
        const team = await this.findOne(playerId, teamId);

        if (dto.name) {
            team.name = dto.name;
        }

        if (dto.data) {
            const { team: rawData, format = 'gen9ou', strict = false } = dto.data;
            const parsedTeam = await this.validateAndParseTeam(rawData, format, strict);
            team.data = parsedTeam;
            team.format = format;
        }

        await this.teamRepository.save(team);
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

    // Leave here in case it is needed
    // private toID(text: string): string {
    //     return text.toLowerCase().replace(/[^a-z0-9]/g, '');
    // }

    private async checkLegality(parsedTeam: PokemonSet[], gen: Generation, strict: boolean): Promise<void> {
        const validator = new TeamValidator('gen9ou');

        const result = validator.validateTeam(parsedTeam);

        if (result) {
            throw new BadRequestException(`Team legality check failed: ${result}`);
        }
    }

    private async validateAndParseTeam(
        data: string,
        format: string,
        strict: boolean
    ): Promise<PokemonSet[]> {
        const match = format.match(/gen(\d+)/);
        const genNumber = match ? Number(match[1]) : 9;
        const gen = this.gens.get(genNumber);

        let parsedTeam: PokemonSet[] = [];

        try {
            const sets = data.split('\n\n');

            for (const set of sets) {
                const parsedSet = Sets.importSet(set.trim());
                if (!parsedSet || !parsedSet.species) {
                    throw new BadRequestException('Invalid Pokémon set data');
                }
                parsedTeam.push(parsedSet as PokemonSet);
            }
        } catch (err) {
            throw new BadRequestException('Failed to parse Showdown team');
        }

        if (parsedTeam.length === 0 || parsedTeam.length > 6) {
            throw new BadRequestException('Team must contain 1 to 6 Pokémon');
        }

        try {
            await this.checkLegality(parsedTeam, gen, strict);
        } catch (err) {
            throw new BadRequestException('Team legality check failed');
        }

        return parsedTeam;
    }
}
