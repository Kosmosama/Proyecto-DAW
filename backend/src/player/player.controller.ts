import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Player } from './decorators/player.decorator';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerPublic } from './interfaces/player-public.interface';
import { PlayerService } from './player.service';
import { Friend } from './interfaces/friend.interface';

@ApiTags('player')
@Controller('player')
export class PlayerController {
    constructor(
        private readonly playerService: PlayerService
    ) {}

    @ApiOperation({ summary: 'Get all players (public info)' })
    @ApiResponse({ status: 200, description: 'List of all players.' })
    @Get()
    findAll(): Promise<PlayerPublic[]> {
        return this.playerService.findAll();
    }

    @ApiOperation({ summary: 'Get the profile of the current logged-in player' })
    @ApiResponse({ status: 200, description: 'Returns the current player profile.' })
    @Get('profile')
    getProfile(@Player() player: PlayerPublic): Promise<PlayerPublic> {
        return this.playerService.findOne(player.id);
    }

    @ApiOperation({ summary: 'Update the profile of the current logged-in player' })
    @ApiResponse({ status: 200, description: 'Returns updated player profile.' })
    @ApiResponse({ status: 400, description: 'Invalid input data.' })
    @Patch('profile')
    updateProfile(
        @Player() player: PlayerPublic,
        @Body() updatePlayerDto: UpdatePlayerDto
    ): Promise<PlayerPublic> {
        return this.playerService.update(player.id, updatePlayerDto);
    }

    @ApiOperation({ summary: 'Get a player by their ID' })
    @ApiResponse({ status: 200, description: 'Returns a player by their ID.' })
    @ApiResponse({ status: 404, description: 'Player not found.' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<PlayerPublic> {
        return this.playerService.findOne(id);
    }

    // #TODO Protect for admin only
    @ApiOperation({ summary: 'Delete a player by their ID' })
    @ApiResponse({ status: 200, description: 'Player deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Player not found.' })
    @ApiResponse({ status: 403, description: 'Unauthorized access.' })
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.playerService.remove(id);
    }

    @ApiOperation({ summary: 'Get friends of the current logged-in player' })
    @ApiResponse({ status: 200, description: 'List of the current player\'s friends.' })
    @Get('friends')
    getFriends(@Player() player: PlayerPublic): Promise<Friend[]> {
        return this.playerService.getFriends(player.id);
    }

    @ApiOperation({ summary: 'Send a friend request to another player' })
    @ApiResponse({ status: 200, description: 'Friend request sent successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid friend ID or request already sent.' })
    @Post('friend-request/:friendId')
    sendFriendRequest(
        @Player() player: PlayerPublic,
        @Param('friendId', ParseIntPipe) friendId: number
    ): Promise<void> {
        if (player.id === friendId) throw new BadRequestException('You cannot send a friend request to yourself.');
        return this.playerService.sendFriendRequest(player.id, friendId);
    }

    @ApiOperation({ summary: 'Accept a friend request from another player' })
    @ApiResponse({ status: 200, description: 'Friend request accepted successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid friend ID or request not found.' })
    @Patch('friend-accept/:friendId')
    acceptFriendRequest(
        @Player() player: PlayerPublic,
        @Param('friendId', ParseIntPipe) friendId: number
    ): Promise<void> {
        return this.playerService.acceptFriendRequest(player.id, friendId);
    }

    @ApiOperation({ summary: 'Decline a friend request from another player' })
    @ApiResponse({ status: 200, description: 'Friend request declined successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid friend ID or request not found.' })
    @Patch('friend-decline/:friendId')
    declineFriendRequest(
        @Player() player: PlayerPublic,
        @Param('friendId', ParseIntPipe) friendId: number
    ): Promise<void> {
        return this.playerService.declineFriendRequest(player.id, friendId);
    }
}
