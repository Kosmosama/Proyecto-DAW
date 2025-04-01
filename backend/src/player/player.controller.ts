import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerResponse } from './interfaces/player-response.interface';
import { PlayerService } from './player.service';

@Controller('player')
// @UseGuards(AuthGuard)
export class PlayerController {
    constructor(
        private readonly playerService: PlayerService
    ) { }

    @Get()
    findAll(): Promise<PlayerResponse[]> {
        return this.playerService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<PlayerResponse> {
        return this.playerService.findOne(id);
    }

    @Get('profile')
    getProfile(@Request() req): Promise<PlayerResponse> {
        return this.playerService.findOne(req.user.id);
    }

    @Patch('profile')
    updateProfile(
        @Request() req,
        @Body() updatePlayerDto: UpdatePlayerDto
    ): Promise<PlayerResponse> {
        return this.playerService.update(req.user.id, updatePlayerDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.playerService.remove(id);
    }

    @Get('friends/:id')
    getFriends(@Param('id', ParseIntPipe) id: number): Promise<PlayerResponse[]> {
        return this.playerService.getFriends(id);
    }

    @Post('friend-request/:friendId')
    sendFriendRequest(
        @Request() req,
        @Param('friendId') friendId: number
    ): Promise<void> {
        return this.playerService.sendFriendRequest(req.user.id, friendId);
    }

    @Patch('friend-accept/:friendId')
    acceptFriendRequest(
        @Request() req, 
        @Param('friendId') friendId: number
    ): Promise<void> {
        return this.playerService.acceptFriendRequest(req.user.id, friendId);
    }

    @Patch('friend-decline/:friendId')
    declineFriendRequest(
        @Request() req, 
        @Param('friendId') friendId: number
    ): Promise<void> {
        return this.playerService.declineFriendRequest(req.user.id, friendId);
    }
}
