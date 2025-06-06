import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Generation, Generations } from '@pkmn/data';
import { Dex, PokemonSet } from '@pkmn/dex';
import { Sets } from '@pkmn/sets';
import { TeamValidator } from 'pokemon-showdown';
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

    /**
     * Creates a new team for the specified player.
     * @param {number} playerId The ID of the player creating the team.
     * @param {CreateTeamDto} dto The data transfer object containing team details.
     * @returns {Promise<Team>} The created team.
     */
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

    /**
     * Updates an existing team for the specified player.
     * @param {number} playerId The ID of the player updating the team.
     * @param {number} teamId The ID of the team to update.
     * @param {UpdateTeamDto} dto The data transfer object containing updated team details.
     * @returns {Promise<void>}
     */
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

    /**
     * Finds all teams for a specific player.
     * @param {number} playerId The ID of the player whose teams to find.
     * @returns {Promise<Team[]>} An array of teams belonging to the player.
     */
    async findAllByPlayer(playerId: number): Promise<Team[]> {
        return this.teamRepository.find({
            where: { player: { id: playerId } },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Finds a specific team by its ID for a given player.
     * @param {number} playerId The ID of the player who owns the team.
     * @param {number} teamId The ID of the team to find.
     * @returns {Promise<Team>} The found team.
     */
    async findOne(playerId: number, teamId: number): Promise<Team> {
        const team = await this.teamRepository.findOne({
            where: { id: teamId, player: { id: playerId } },
        });
        if (!team) throw new NotFoundException('Team not found');
        return team;
    }

    /**
     * Deletes a team for a specific player.
     * @param {number} playerId The ID of the player who owns the team.
     * @param {number} teamId The ID of the team to delete.
     * @returns {Promise<void>}
     */
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

    /**
     * Validates and parses a Showdown team string.
     * @param {string} data The raw team data as a string.
     * @param {string} format The format to validate against (e.g., 'gen9ou').
     * @param {boolean} strict Whether to enforce strict legality checks.
     * @returns {Promise<PokemonSet[]>} An array of parsed Pokémon sets.
     */
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

        // try {
        //     await this.checkLegality(parsedTeam, gen, strict);
        // } catch (err) {
        //     throw new BadRequestException('Team legality check failed');
        // }

        return parsedTeam;
    }
}
