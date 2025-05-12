import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Generation, Generations } from '@pkmn/data';
import { Dex, PokemonSet } from '@pkmn/dex';
import { Sets } from '@pkmn/sets';
import { PlayerService } from 'src/player/player.service';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamValidator } from '@pkmn/sim'

@Injectable()
export class TeamService {
    private readonly gens = new Generations(Dex);

    constructor(
        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
        private readonly playerService: PlayerService,
    ) { }

    async create(
        playerId: number,
        name: string,
        data: string,
        format: string = 'gen9ou',
        strict: boolean = true
    ): Promise<Team> {
        const player = await this.playerService.findOnePrivate(playerId);
        if (!player) throw new NotFoundException('Player not found');

        const match = format.match(/gen(\d+)/);
        const genNumber = match ? Number(match[1]) : 9;
        const gen = this.gens.get(genNumber);

        let parsedTeam: PokemonSet[] = [];

        try {
            const sets = data.split('\n\n');

            for (const set of sets) {
                const parsedSet = Sets.importSet(set.trim());
                console.log('Parsed set:', parsedSet);
                if (!parsedSet || !parsedSet.species) {
                    throw new BadRequestException('Invalid Pokémon set data');
                }

                parsedTeam.push(parsedSet as PokemonSet);
            }
        } catch (err) {
            console.error('Error parsing test set:', err);
            throw new BadRequestException('Failed to parse Showdown test set');
        }

        if (parsedTeam.length === 0 || parsedTeam.length > 6) {
            throw new BadRequestException('Team must contain 1 to 6 Pokémon');
        }

        try {
            await this.checkLegality(parsedTeam, gen, strict);
        } catch (err) {
            console.error('Legality check failed:', err);
            throw new BadRequestException('Team legality check failed');
        }

        const team = this.teamRepository.create({
            name,
            data: data,
            format,
            player,
        });

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

    private toID(text: string): string {
        return text.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private async checkLegality(parsedTeam: PokemonSet[], gen: Generation, strict: boolean): Promise<void> {
        const validator = new TeamValidator('gen9ou');

        const result = validator.validateTeam(parsedTeam);

        if (result) {
            throw new BadRequestException(`Team legality check failed: ${result}`);
        }
    }
}
