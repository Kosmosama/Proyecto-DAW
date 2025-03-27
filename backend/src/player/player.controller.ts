import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerService } from './player.service';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Controller('player')
export class PlayerController {
    constructor(
        private readonly playerService: PlayerService
    ) { }

    @Post()
    create(@Body() createPlayerDto: CreatePlayerDto) {
        return this.playerService.create(createPlayerDto);
    }

    @Get()
    findAll() {
        return this.playerService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.playerService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updatePlayerDto: UpdatePlayerDto) {
        return this.playerService.update(id, updatePlayerDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.playerService.remove(id);
    }

    @Post('friend-request')
    sendFriendRequest(
        @Body('idPlayer1', ParseIntPipe) idPlayer1: number,
        @Body('idPlayer2', ParseIntPipe) idPlayer2: number
    ) {
        return this.playerService.sendFriendRequest(idPlayer1, idPlayer2);
    }

    @Patch('friend-accept/:idPlayer1/:idPlayer2')
    acceptFriendRequest(
        @Param('idPlayer1', ParseIntPipe) idPlayer1: number,
        @Param('idPlayer2', ParseIntPipe) idPlayer2: number
    ) {
        return this.playerService.acceptFriendRequest(idPlayer1, idPlayer2);
    }

    @Patch('friend-decline/:idPlayer1/:idPlayer2')
    declineFriendRequest(
        @Param('idPlayer1', ParseIntPipe) idPlayer1: number,
        @Param('idPlayer2', ParseIntPipe) idPlayer2: number
    ) {
        return this.playerService.declineFriendRequest(idPlayer1, idPlayer2);
    }
}
