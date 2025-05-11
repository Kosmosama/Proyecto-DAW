import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Generation, Generations } from '@pkmn/data';
import { Dex, PokemonSet } from '@pkmn/dex';
import { Sets } from '@pkmn/sets';
import { PlayerService } from 'src/player/player.service';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';

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

        let parsedTeam;
        try {
            parsedTeam = Sets.importSet(data);
        } catch (err) {
            throw new BadRequestException('Failed to parse Showdown team format');
        }

        if (parsedTeam.length === 0 || parsedTeam.length > 6) {
            throw new BadRequestException('Team must contain 1 to 6 Pokémon');
        }

        try {
            await this.checkLegality(parsedTeam, gen, strict);
        } catch (err) {
            console.error('Legality check failed:', err);
            throw new BadRequestException(`Team legality check failed`);
        }

        const team = this.teamRepository.create({
            name,
            data,
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
        for (const set of parsedTeam) {
            const speciesName = set.species || set.name;
            const species = gen.species.get(speciesName);
            if (!species || !species.exists) {
                throw new BadRequestException(`Invalid Pokémon species: ${speciesName}`);
            }

            this.validateAbility(set, gen, species, strict);
            this.validateItem(set, gen);
            this.validateNature(set, gen);
            this.validateMoves(set, gen, species, strict);
        }
    }

    private validateAbility(set: PokemonSet, gen: Generation, species: any, strict: boolean) {
        if (!set.ability) return;

        const ability = gen.abilities.get(set.ability);
        if (!ability || !ability.exists) {
            throw new BadRequestException(`Invalid ability: ${set.ability}`);
        }

        if (strict) {
            const allowedAbilities = Object.values(species.abilities || {});
            if (!allowedAbilities.includes(set.ability)) {
                throw new BadRequestException(`${species.name} cannot have ability: ${set.ability}`);
            }
        }
    }

    private validateItem(set: PokemonSet, gen: Generation) {
        if (!set.item) return;

        const item = gen.items.get(set.item);
        if (!item || !item.exists) {
            throw new BadRequestException(`Invalid item: ${set.item}`);
        }
    }

    private validateNature(set: PokemonSet, gen: Generation) {
        if (!set.nature) return;

        const nature = gen.natures.get(set.nature);
        if (!nature || !nature.name) {
            throw new BadRequestException(`Invalid nature: ${set.nature}`);
        }
    }

    private validateMoves(set: PokemonSet, gen: Generation, species: any, strict: boolean) {
        for (const move of set.moves || []) {
            const moveData = gen.moves.get(move);
            if (!moveData || !moveData.exists) {
                throw new BadRequestException(`Invalid move: ${move}`);
            }

            if (strict) {
                const learnset = gen.learnsets.get(this.toID(species.name));
                const moveID = this.toID(move);
                if (!learnset || !learnset[moveID]) {
                    throw new BadRequestException(`${species.name} can't learn ${move}`);
                }
            }
        }
    }
}
