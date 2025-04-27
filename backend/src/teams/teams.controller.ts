import { Controller, Post, Get, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TeamService } from './teams.service';
import { Player } from 'src/player/decorators/player.decorator';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { CreateTeamDto } from './dto/create-team.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('players/:playerId/teams')
@UseGuards(RolesGuard)
@Roles([Role.SELF, Role.ADMIN], { selfParam: 'playerId' })
export class TeamController {
    constructor(
        private readonly teamService: TeamService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new team for a player' })
    @ApiBody({ type: CreateTeamDto })
    @ApiResponse({ status: 201, description: 'Team successfully created.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(
        @Player() player: PlayerPrivate,
        @Body() team: CreateTeamDto
    ) {
        return this.teamService.create(player.id, team.name, team.data);
    }

    @Get()
    @ApiOperation({ summary: 'Get all teams for a player' })
    @ApiResponse({ status: 200, description: 'List of teams.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(
        @Player() player: PlayerPrivate
    ) {
        return this.teamService.findAllByPlayer(player.id);
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
