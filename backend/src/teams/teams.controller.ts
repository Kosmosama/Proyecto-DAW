import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Player } from 'src/auth/decorators/player.decorator';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamService } from './teams.service';
import { UpdateTeamDto } from './dto/update-team.dto';

@ApiTags('Teams')
@Controller('teams')
export class TeamController {
    constructor(
        private readonly teamService: TeamService
    ) { }

    @Patch(':teamId')
    @ApiOperation({ summary: 'Update an existing team for a player' })
    @ApiParam({ name: 'teamId', type: Number, description: 'ID of the team to update' })
    @ApiBody({ type: UpdateTeamDto })
    @ApiResponse({ status: 200, description: 'Team successfully updated.' })
    @ApiResponse({ status: 404, description: 'Team not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async update(
        @Player() player: PlayerPrivate,
        @Param('teamId', ParseIntPipe) teamId: number,
        @Body() updateTeamDto: UpdateTeamDto
    ): Promise<void> {
        await this.teamService.update(player.id, teamId, updateTeamDto);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new team for a player' })
    @ApiBody({ type: CreateTeamDto })
    @ApiResponse({ status: 201, description: 'Team successfully created.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(
        @Player() player: PlayerPrivate,
        @Body() createTeamDto: CreateTeamDto
    ): Promise<void> {
        await this.teamService.create(player.id, createTeamDto);
    }

    @Get(':teamId')
    @ApiOperation({ summary: 'Get a specific team by ID' })
    @ApiParam({ name: 'teamId', type: Number, description: 'ID of the team' })
    @ApiResponse({ status: 200, description: 'Team details.' })
    @ApiResponse({ status: 404, description: 'Team not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findOne(
        @Player() player: PlayerPrivate,
        @Param('teamId', ParseIntPipe) teamId: number
    ) {
        return this.teamService.findOne(player.id, teamId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all teams for any player or the logged-in player' })
    @ApiQuery({ name: 'playerId', required: false, type: Number, description: 'Optional player ID to filter teams by' })
    @ApiResponse({ status: 200, description: 'List of teams.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(
        @Player() player: PlayerPrivate,
        @Query('playerId') playerId?: number
    ) {
        const targetPlayerId = playerId ?? player.id;
        return this.teamService.findAllByPlayer(targetPlayerId);
    }

    @Delete(':teamId')
    @ApiOperation({ summary: 'Delete a team by ID' })
    @ApiParam({ name: 'teamId', type: Number, description: 'ID of the team to delete' })
    @ApiResponse({ status: 200, description: 'Team successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Team not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async delete(
        @Player() player: PlayerPrivate,
        @Param('teamId', ParseIntPipe) teamId: number
    ) {
        return this.teamService.delete(player.id, teamId);
    }
}
