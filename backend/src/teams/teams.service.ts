import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { PlayerService } from 'src/player/player.service';
import { Dex, GenerationNum } from '@pkmn/dex';
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

    // async create(
    //     playerId: number,
    //     name: string,
    //     data: string,
    //     mode: 'any' | 'legal',
    //     format: string = 'gen9ou'
    // ): Promise<Team> {
    //     const player = await this.playerService.findOnePrivate(playerId);
    //     if (!player) throw new NotFoundException('Player not found');

    //     const genNumber = Number(format.match(/gen(\d+)/)?.[1] || '9') as GenerationNum;
    //     const gens = new Generations(Dex);
    //     const gen = gens.get(genNumber);

    //     let parsed;
    //     try {
    //         parsed = PSTeam.import(data, { gen }); // I NEED FUCKING DOCUMENTATION FOR THIS
    //     } catch (err) {
    //         throw new BadRequestException('Failed to parse Showdown team format');
    //     }

    //     if (parsed.length === 0 || parsed.length > 6) {
    //         throw new BadRequestException('Team must contain 1 to 6 Pokémon');
    //     }

    //     // I think all this can be done with the import function, gotta check later, too tired now
    //     for (const set of parsed) {
    //         const speciesName = set.species || set.name;
    //         const species = gen.species.get(speciesName);
    //         if (!species || !species.exists) {
    //             throw new BadRequestException(`Invalid Pokémon: ${speciesName}`);
    //         }

    //         for (const move of set.moves) {
    //             const moveData = gen.moves.get(move);
    //             if (!moveData || !moveData.exists) {
    //                 throw new BadRequestException(`Invalid move: ${move}`);
    //             }
    //         }

    //         if (mode === 'legal') {
    //             const learnset = gen.learnsets.get(species.id);
    //             if (!learnset) {
    //                 throw new BadRequestException(`No learnset found for ${species.name}`);
    //             }

    //             for (const move of set.moves) {
    //                 const learned = learnset[move];
    //                 if (!learned) {
    //                     throw new BadRequestException(
    //                         `${species.name} can't learn ${move} in ${format}`
    //                     );
    //                 }
    //             }
    //         }
    //     }

    //     const team = this.teamRepository.create({ name, data, player });
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
}
