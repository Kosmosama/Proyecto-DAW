import { Controller, Post, Get, Delete, Param, Body, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { TeamService } from './teams.service';
import { Player } from 'src/player/decorators/player.decorator';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { CreateTeamDto } from './dto/create-team.dto';

@Controller('players/:playerId/teams')
export class TeamController {
    constructor(
        private readonly teamService: TeamService
    ) { }

    @Post()
    async create(
        @Player() player: PlayerPrivate,
        @Body() team: CreateTeamDto,
        @Param('playerId', ParseIntPipe) playerId: number
    ) {
        if (player.id !== playerId) return new UnauthorizedException('You are not allowed to create a team for another player.');
        return this.teamService.create(player.id, team.name, team.data);
    }

    @Get()
    async findAll(
        @Player() player: PlayerPrivate,
        @Param('playerId', ParseIntPipe) playerId: number
    ) {
        if (player.id !== playerId) return new UnauthorizedException('You can\'t see another player\'s teams.');
        return this.teamService.findAllByPlayer(player.id);
    }

    @Get(':teamId')
    async findOne(
        @Player() player: PlayerPrivate,
        @Param('teamId', ParseIntPipe) teamId: number,
        @Param('playerId', ParseIntPipe) playerId: number
    ) {
        if (player.id !== playerId) return new UnauthorizedException('You can\'t see another player\'s team.');
        return this.teamService.findOne(player.id, teamId);
    }

    @Delete(':teamId')
    async delete(
        @Player() player: PlayerPrivate,
        @Param('teamId', ParseIntPipe) teamId: number,
        @Param('playerId', ParseIntPipe) playerId: number
    ) {
        if (player.id !== playerId) return new UnauthorizedException('You can\'t delete another player\'s team.');
        return this.teamService.delete(player.id, teamId);
    }
}
