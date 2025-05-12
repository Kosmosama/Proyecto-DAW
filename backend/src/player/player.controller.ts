import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Player } from './decorators/player.decorator';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerPublic } from './interfaces/player-public.interface';
import { Friend } from './interfaces/friend.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PlayerService } from './player.service';
import { FriendRequest } from './interfaces/friend-request.interface';
import { PlayerPrivate } from './interfaces/player-private.interface';

@ApiTags('player')
@Controller('player')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) { }

    @Get()
    @ApiOperation({
        summary: 'Get all players (public info)',
        description: 'Retrieve a paginated list of players, optionally filtered by a search term.',
    })
    @ApiResponse({ status: 200, description: 'List of all players returned successfully.' })
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('search') search?: string,
        @Query('excludeIds') excludeIds?: string[]
    ): Promise<PaginatedResult<PlayerPublic>> {
        const parsedExcludeIds = excludeIds?.map(id => Number(id)) ?? [];
        return this.playerService.findAll(Number(page), Number(limit), search, parsedExcludeIds);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get current player profile' })
    @ApiResponse({ status: 200, description: 'Returns the private profile of the authenticated player.' })
    getProfile(@Player() player: PlayerPrivate): Promise<PlayerPrivate> {
        return this.playerService.findOnePrivate(player.id);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update current player profile' })
    @ApiBody({ type: UpdatePlayerDto })
    @ApiResponse({ status: 200, description: 'Player profile updated successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid data provided in the request body.' })
    updateProfile(
        @Player() player: PlayerPrivate,
        @Body() updatePlayerDto: UpdatePlayerDto
    ): Promise<PlayerPublic> {
        return this.playerService.update(player.id, updatePlayerDto);
    }

    @Get('friends')
    @ApiOperation({ summary: 'List friends of current player' })
    @ApiResponse({ status: 200, description: 'Returns a paginated list of the player’s friends.' })
    getFriends(
        @Player() player: PlayerPrivate,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ): Promise<PaginatedResult<Friend>> {
        return this.playerService.getFriends(player.id, Number(page), Number(limit));
    }

    @Get('friend-requests/incoming')
    @ApiOperation({ summary: 'List incoming friend requests' })
    @ApiResponse({ status: 200, description: 'Returns all pending incoming friend requests.' })
    getIncomingRequests(
        @Player() player: PlayerPrivate,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ): Promise<PaginatedResult<FriendRequest>> {
        return this.playerService.getIncomingFriendRequests(player.id, Number(page), Number(limit));
    }

    @Get('friend-requests/outgoing')
    @ApiOperation({ summary: 'List outgoing friend requests' })
    @ApiResponse({ status: 200, description: 'Returns all pending outgoing friend requests sent by the player.' })
    @ApiResponse({ status: 404, description: 'No outgoing friend requests found.' })
    getOutgoingFriendRequests(
        @Player() player: PlayerPrivate,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ): Promise<PaginatedResult<FriendRequest>> {
        return this.playerService.getPendingOutgoing(player.id, Number(page), Number(limit));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a player by ID (public info)' })
    @ApiResponse({ status: 200, description: 'Returns public data of the player.' })
    @ApiResponse({ status: 404, description: 'Player with the specified ID was not found.' })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<PlayerPublic> {
        return this.playerService.findOnePublic(id);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Delete a player (Admin only)' })
    @ApiResponse({ status: 200, description: 'Player deleted successfully.' })
    @ApiResponse({ status: 403, description: 'User lacks admin privileges.' })
    @ApiResponse({ status: 404, description: 'Player not found.' })
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.playerService.remove(id);
    }

    @Post('friend-request/:recieverId')
    @ApiOperation({ summary: 'Send a friend request' })
    @ApiResponse({ status: 200, description: 'Friend request sent successfully.' })
    @ApiResponse({ status: 400, description: 'Cannot send request to yourself or duplicate request.' })
    sendFriendRequest(
        @Player() player: PlayerPrivate,
        @Param('recieverId', ParseIntPipe) recieverId: number
    ): Promise<void> {
        return this.playerService.sendFriendRequest(player.id, recieverId);
    }

    @Patch('friend-accept/:senderId')
    @ApiOperation({ summary: 'Accept a friend request' })
    @ApiResponse({ status: 200, description: 'Friend request accepted.' })
    @ApiResponse({ status: 400, description: 'Invalid request or already accepted.' })
    acceptFriendRequest(
        @Player() player: PlayerPrivate,
        @Param('senderId', ParseIntPipe) senderId: number
    ): Promise<void> {
        return this.playerService.acceptFriendRequest(senderId, player.id);
    }

    @Patch('friend-decline/:senderId')
    @ApiOperation({ summary: 'Decline a friend request' })
    @ApiResponse({ status: 200, description: 'Friend request declined.' })
    @ApiResponse({ status: 400, description: 'Invalid request or already declined.' })
    declineFriendRequest(
        @Player() player: PlayerPrivate,
        @Param('senderId', ParseIntPipe) senderId: number
    ): Promise<void> {
        return this.playerService.declineFriendRequest(senderId, player.id);
    }
}
