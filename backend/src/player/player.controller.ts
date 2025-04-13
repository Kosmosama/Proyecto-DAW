import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Player } from './decorators/player.decorator';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerPublic } from './interfaces/player-public.interface';
import { Friend } from './interfaces/friend.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PlayerService } from './player.service';

@ApiTags('player')
@Controller('player')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) { }

    @Get()
    @ApiOperation({ summary: 'Get all players (public info)' })
    @ApiResponse({ status: 200, description: 'List of all players.' })
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('search') search?: string
    ): Promise<PlayerPublic[]> {
        return this.playerService.findAll(Number(page), Number(limit), search);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get the profile of the current logged-in player' })
    @ApiResponse({ status: 200, description: 'Returns the current player profile.' })
    getProfile(@Player() player: PlayerPublic): Promise<PlayerPublic> {
        return this.playerService.findOne(player.id);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update the profile of the current logged-in player' })
    @ApiResponse({ status: 200, description: 'Returns updated player profile.' })
    @ApiResponse({ status: 400, description: 'Invalid input data.' })
    updateProfile(
        @Player() player: PlayerPublic,
        @Body() updatePlayerDto: UpdatePlayerDto
    ): Promise<PlayerPublic> {
        return this.playerService.update(player.id, updatePlayerDto);
    }

    @Get('friends')
    @ApiOperation({ summary: 'Get friends of the current logged-in player' })
    @ApiResponse({ status: 200, description: 'List of the current player\'s friends.' })
    getFriends(
        @Player() player: PlayerPublic,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ): Promise<Friend[]> {
        return this.playerService.getFriends(player.id, Number(page), Number(limit));
    }

    @Get('friend-requests/incoming')
    @ApiOperation({ summary: 'Get incoming friend requests' })
    @ApiResponse({ status: 200, description: 'List of incoming friend requests.' })
    getIncomingRequests(
        @Player() player: PlayerPublic,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ): Promise<Friend[]> {
        return this.playerService.getIncomingFriendRequests(player.id, Number(page), Number(limit));
    }

    @Get('friend-requests/outgoing')
    @ApiOperation({ summary: 'Get outgoing friend requests (sent by you)' })
    @ApiResponse({ status: 200, description: 'List of sent friend requests.' })
    @ApiResponse({ status: 404, description: 'No outgoing friend requests found.' })
    getOutgoingFriendRequests(
        @Player() player: PlayerPublic,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ): Promise<Friend[]> {
        return this.playerService.getPendingOutgoing(player.id, Number(page), Number(limit));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a player by their ID' })
    @ApiResponse({ status: 200, description: 'Returns a player by their ID.' })
    @ApiResponse({ status: 404, description: 'Player not found.' })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<PlayerPublic> {
        return this.playerService.findOne(id);
    }

    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a player by their ID' })
    @ApiResponse({ status: 200, description: 'Player deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Player not found.' })
    @ApiResponse({ status: 403, description: 'Unauthorized access.' })
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.playerService.remove(id);
    }

    @Post('friend-request/:recieverId')
    @ApiOperation({ summary: 'Send a friend request to another player' })
    @ApiResponse({ status: 200, description: 'Friend request sent successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid friend ID or request already sent.' })
    sendFriendRequest(
        @Player() player: PlayerPublic,
        @Param('recieverId', ParseIntPipe) recieverId: number
    ): Promise<void> {
        if (player.id === recieverId) throw new BadRequestException('You cannot send a friend request to yourself.');
        return this.playerService.sendFriendRequest(player.id, recieverId);
    }

    @Patch('friend-accept/:senderId')
    @ApiOperation({ summary: 'Accept a friend request from another player' })
    @ApiResponse({ status: 200, description: 'Friend request accepted successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid friend ID or request not found.' })
    acceptFriendRequest(
        @Player() player: PlayerPublic,
        @Param('senderId', ParseIntPipe) senderId: number
    ): Promise<void> {
        return this.playerService.acceptFriendRequest(senderId, player.id);
    }

    @Patch('friend-decline/:senderId')
    @ApiOperation({ summary: 'Decline a friend request from another player' })
    @ApiResponse({ status: 200, description: 'Friend request declined successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid friend ID or request not found.' })
    declineFriendRequest(
        @Player() player: PlayerPublic,
        @Param('senderId', ParseIntPipe) senderId: number
    ): Promise<void> {
        return this.playerService.declineFriendRequest(senderId, player.id);
    }
}
