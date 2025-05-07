import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { PlayerService } from 'src/player/player.service';
import { Dex, GenerationNum, PokemonSet } from '@pkmn/dex';
import { Team as PSTeam } from '@pkmn/sets';
import { Generations } from '@pkmn/data';

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

    // async createTeam(
    //     playerId: number,
    //     name: string,
    //     data: string,
    //     format: string = 'gen9ou', // Default to Gen 9 OU format
    //     strict: boolean = true // Set whether to strictly check legality of moves/abilities
    // ): Promise<Team> {
    //     const player = await this.playerService.findOnePrivate(playerId);
    //     if (!player) throw new NotFoundException('Player not found');

    //     const genNumber = Number(format.match(/gen(\d+)/)?.[1] || '9');
    //     const gens = new Generations(Dex);
    //     const gen = gens.get(genNumber);

    //     let parsedTeam;
    //     try {
    //         parsedTeam = PSTeam.import(data, { gen });
    //     } catch (err) {
    //         throw new BadRequestException('Failed to parse Showdown team format');
    //     }

    //     try {
    //         await this.checkLegality(parsedTeam, genNumber, strict);
    //     } catch (err) {
    //         throw new BadRequestException(`Team legality check failed: ${err.message}`);
    //     }

    //     if (parsedTeam.length === 0 || parsedTeam.length > 6) {
    //         throw new BadRequestException('Team must contain 1 to 6 Pokémon');
    //     }

    //     const team = this.teamRepository.create({
    //         name,
    //         data, // Maybe change this to PokemonSet<string> later
    //         format,
    //         player,
    //     });

    //     return this.teamRepository.save(team);
    // }

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

    private async checkLegality(
        parsedTeam: PokemonSet[],
        genNum: number,
        strict: boolean
    ): Promise<void> {
        const gens = new Generations(Dex);
        const gen = gens.get(genNum as any);

        for (const set of parsedTeam) {
            const speciesName = set.species || set.name;
            const species = gen.species.get(speciesName);
            if (!species || !species.exists) {
                throw new BadRequestException(`Invalid Pokémon species: ${speciesName}`);
            }

            if (set.ability) {
                const ability = gen.abilities.get(set.ability);
                if (!ability || !ability.exists) {
                    throw new BadRequestException(`Invalid ability: ${set.ability}`);
                }

                if (strict) {
                    const allowedAbilities = Object.values(species.abilities || {});
                    if (!allowedAbilities.includes(set.ability)) {
                        throw new BadRequestException(
                            `${species.name} cannot have ability: ${set.ability} in Gen ${genNum}`
                        );
                    }
                }
            }

            if (set.item) {
                const item = gen.items.get(set.item);
                if (!item || !item.exists) {
                    throw new BadRequestException(`Invalid item: ${set.item}`);
                }
            }

            if (set.nature) {
                const nature = gen.natures.get(set.nature);
                if (!nature || !nature.name) {
                    throw new BadRequestException(`Invalid nature: ${set.nature}`);
                }
            }

            for (const move of set.moves || []) {
                const moveData = gen.moves.get(move);
                if (!moveData || !moveData.exists) {
                    throw new BadRequestException(`Invalid move: ${move}`);
                }

                if (strict) {
                    const learnset = gen.learnsets.get(this.toID(species.name));
                    if (!learnset || !learnset[this.toID(move)]) {
                        throw new BadRequestException(
                            `${species.name} can't learn ${move} in Gen ${genNum}`
                        );
                    }
                }
            }
        }
    }
}
