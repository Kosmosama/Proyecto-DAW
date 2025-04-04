import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request } from '@nestjs/common';
import { Player } from './decorators/player.decorator';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerPublic } from './interfaces/player-public.interface';
import { PlayerService } from './player.service';
import { Friend } from './interfaces/friend.interface';

@Controller('player')
export class PlayerController {
    constructor(
        private readonly playerService: PlayerService
    ) { }

    @Get()
    findAll(): Promise<PlayerPublic[]> {
        return this.playerService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<PlayerPublic> {
        return this.playerService.findOne(id);
    }

    @Get('profile')
    getProfile(@Player() player: PlayerPublic): Promise<PlayerPublic> {
        return this.playerService.findOne(player.id);
    }

    // #TODO Protect for self or admin only
    @Patch('profile')
    updateProfile(
        @Player() player: PlayerPublic,
        @Body() updatePlayerDto: UpdatePlayerDto
    ): Promise<PlayerPublic> {
        return this.playerService.update(player.id, updatePlayerDto);
    }

    //#TODO Protect for admin only
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.playerService.remove(id);
    }

    @Get('friends')
    getFriends(@Player() player: PlayerPublic): Promise<Friend[]> {
        return this.playerService.getFriends(player.id);
    }

    // #TODO Protect for self or admin only
    @Post('friend-request/:friendId')
    sendFriendRequest(
        @Player() player: PlayerPublic,
        @Param('friendId') friendId: number
    ): Promise<void> {
        return this.playerService.sendFriendRequest(player.id, friendId);
    }

    // #TODO Protect for self or admin only
    @Patch('friend-accept/:friendId')
    acceptFriendRequest(
        @Player() player: PlayerPublic,
        @Param('friendId') friendId: number
    ): Promise<void> {
        return this.playerService.acceptFriendRequest(player.id, friendId);
    }

    // #TODO Protect for self or admin only
    @Patch('friend-decline/:friendId')
    declineFriendRequest(
        @Player() player: PlayerPublic,
        @Param('friendId') friendId: number
    ): Promise<void> {
        return this.playerService.declineFriendRequest(player.id, friendId);
    }
}
