import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { PlayerService } from './player.service';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('player')
@UseGuards(AuthGuard)
export class PlayerController {
    constructor(
        private readonly playerService: PlayerService
    ) { }

    @Get()
    findAll() {
        return this.playerService.findAll();
    }

    @Get('profile')
    getProfile(@Request() req) {
        return this.playerService.findOne(req.user.id);
    }

    @Patch('profile')
    updateProfile(
        @Request() req,
        @Body() updatePlayerDto: UpdatePlayerDto
    ) {
        return this.playerService.update(req.user.id, updatePlayerDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.playerService.remove(id);
    }

    @Get('friends/:id')
    getFriends(@Param('id', ParseIntPipe) id: number) {
        return this.playerService.getFriends(id);
    }

    @Post('friend-request/:friendId')
    sendFriendRequest(
        @Request() req,
        @Body('friendId') friendId: number
    ) {
        return this.playerService.sendFriendRequest(req.user.id, friendId);
    }

    @Patch('friend-accept/:friendId')
    acceptFriendRequest(
        @Request() req, 
        @Param('friendId') friendId: number
    ) {
        return this.playerService.acceptFriendRequest(req.user.id, friendId);
    }

    @Patch('friend-decline/:friendId')
    declineFriendRequest(
        @Request() req, 
        @Param('friendId') friendId: number
    ) {
        return this.playerService.declineFriendRequest(req.user.id, friendId);
    }
}
