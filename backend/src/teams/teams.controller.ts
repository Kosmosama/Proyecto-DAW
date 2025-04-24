import { Controller, Post, Get, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { TeamService } from './teams.service';
import { Player } from 'src/player/decorators/player.decorator';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';

@Controller('players/:playerId/teams')
export class TeamController {
    constructor(
        private readonly teamService: TeamService
    ) { }

    @Post()
    async create(
        @Player() player: PlayerPrivate,
        @Body() body: { name: string; data: any }
    ) {
        return this.teamService.create(player.id, body.name, body.data);
    }

    @Get()
    async findAll(@Player() player: PlayerPrivate) {
        return this.teamService.findAllByPlayer(player.id);
    }

    @Get(':teamId')
    async findOne(
        @Player() player: PlayerPrivate,
        @Param('teamId', ParseIntPipe) teamId: number
    ) {
        return this.teamService.findOne(player.id, teamId);
    }

    @Delete(':teamId')
    async delete(
        @Player() player: PlayerPrivate,
        @Param('teamId', ParseIntPipe) teamId: number
    ) {
        return this.teamService.delete(player.id, teamId);
    }
}
