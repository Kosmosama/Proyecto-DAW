import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';
import { emitToPlayer } from 'src/common/utils/emit.util';
import { PlayerService } from 'src/player/player.service';
import { ONLINE_PLAYERS, PLAYER_FRIENDS_PREFIX, PLAYER_SOCKETS_PREFIX, SOCKET_TO_PLAYER } from '../common/constants/redis.constants';
import { GameService } from './game.service';
import { MatchmakingService } from './matchmaking.service';
import { SocketEvents } from 'src/common/constants/events.constants';

@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name);
    private disconnectTimers = new Map<number, NodeJS.Timeout>();

    constructor(
        private readonly playerService: PlayerService,
        private readonly matchmakingService: MatchmakingService,
        private readonly gameService: GameService,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    /**
     * Handles a new connection for a player.
     * @param {Socket} client The socket client representing the connection.
     * @param {number} playerId The ID of the player.
     * @param {Server} server The Socket.IO server instance.
     * @returns {Promise<void>} No return value.
     */
    async handleNewConnection(client: Socket, playerId: number, server: Server) {
        await this.redis.hset(SOCKET_TO_PLAYER, client.id, playerId.toString());
        await this.redis.sadd(`${PLAYER_SOCKETS_PREFIX}${playerId}`, client.id);
        await this.gameService.restoreActiveMatches(playerId, server);

        // If there's a pending disconnect timer, cancel it because the player reconnected
        if (this.disconnectTimers.has(playerId)) {
            clearTimeout(this.disconnectTimers.get(playerId)!);
            this.disconnectTimers.delete(playerId);
            this.logger.debug(`Cancelled offline timer for player ${playerId} due to new connection.`);
        }

        // If this is the first active socket for the player, mark them as online
        const socketCount = await this.redis.scard(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
        if (socketCount === 1) {
            await this.redis.sadd(ONLINE_PLAYERS, playerId.toString());
            await this.broadcastOnlineStatusToFriends(playerId, server);
        }
    }

    /**
     * Handles disconnection of a player.
     * @param {Socket} client The socket client representing the connection.
     * @param {Server} server The Socket.IO server instance.
     * @returns {Promise<number | null>} The ID of the player if found, otherwise null.
     */
    async handleDisconnection(client: Socket, server: Server): Promise<number | null> {
        const playerIdStr = await this.redis.hget(SOCKET_TO_PLAYER, client.id);
        if (!playerIdStr) return null;

        const playerId = parseInt(playerIdStr, 10);
        this.logger.debug(`Handling disconnect for player ${playerId} with socket ${client.id}`);

        await this.playerService.updateLastLogin(playerId);

        await this.redis.hdel(SOCKET_TO_PLAYER, client.id);
        await this.redis.srem(`${PLAYER_SOCKETS_PREFIX}${playerId}`, client.id);

        // Check if the player has any sockets left
        const remaining = await this.redis.scard(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
        if (remaining === 0) {
            this.logger.debug(`Starting offline timer for player ${playerId}`);

            // Wait 5 seconds before officially marking the player offline (grace period)
            const timer = setTimeout(async () => {
                const stillRemaining = await this.redis.scard(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
                if (stillRemaining === 0) {
                    // Confirmed: no reconnects, clean up state and notify friends
                    await this.redis.del(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
                    await this.redis.srem(ONLINE_PLAYERS, playerId.toString());

                    await this.matchmakingService.cleanupPlayerRequests(playerId);
                    await this.matchmakingService.leaveMatchmaking(playerId);
                    await this.gameService.handlePlayerDisconnect(playerId, server);

                    await this.broadcastOfflineStatusToFriends(playerId, server);
                    this.logger.debug(`Player ${playerId} is no longer online.`);
                } else {
                    this.logger.debug(`Player ${playerId} reconnected during grace period.`);
                }
                this.disconnectTimers.delete(playerId);
            }, 5000);

            this.disconnectTimers.set(playerId, timer);
        } else {
            this.logger.debug(`Player ${playerId} still has ${remaining} active socket(s).`);
        }

        return playerId;
    }

    /**
     * Notifies friends of a player when they come online.
     * @param {number} playerId The ID of the player.
     * @param {Server} server The Socket.IO server instance.
     * @returns {Promise<void>} No return value.
     */
    private async broadcastOnlineStatusToFriends(playerId: number, server: Server): Promise<void> {
        this.logger.debug(`Broadcasting online status for player ${playerId} to friends`);
        const friends = await this.playerService.getFriends(playerId);
        const friendIds: number[] = (friends?.data ?? []).map((f: { id: number }) => f.id);

        // Cache the friend list in Redis for use when going offline
        if (friendIds.length > 0) {
            const friendIdStrings: string[] = friendIds.map(String);
            await this.redis.sadd(`${PLAYER_FRIENDS_PREFIX}${playerId}`, ...friendIdStrings);
        }

        // Check which friends are currently online
        const pipeline = this.redis.pipeline();
        friendIds.forEach(id => {
            pipeline.sismember(ONLINE_PLAYERS, id.toString());
        });
        const results = await pipeline.exec();

        const onlineFriendIds = friendIds.filter((_, i) => results?.[i]?.[1] === 1);

        await emitToPlayer(this.redis, server, playerId, SocketEvents.Friends.Emit.FriendsOnline, onlineFriendIds);

        await Promise.all(
            onlineFriendIds.map(id => emitToPlayer(this.redis, server, id, SocketEvents.Friends.Emit.FriendOnline, playerId))
        );
    }

    /**
     * Notifies friends of a player when they go offline.
     * @param {number} playerId The ID of the player.
     * @param {Server} server The Socket.IO server instance.
     * @returns {Promise<void>} No return value.
     */
    private async broadcastOfflineStatusToFriends(playerId: number, server: Server) {
        this.logger.debug(`Broadcasting offline status for player ${playerId} to friends`);

        // Retrieve and remove cached friend IDs from Redis
        const friendIdStrings = await this.redis.smembers(`${PLAYER_FRIENDS_PREFIX}${playerId}`);
        await this.redis.del(`${PLAYER_FRIENDS_PREFIX}${playerId}`);

        if (friendIdStrings.length === 0) return;

        const friendIds = friendIdStrings.map(id => parseInt(id, 10));

        // Check which friends are currently online
        const pipeline = this.redis.pipeline();
        friendIdStrings.forEach(id => pipeline.sismember(ONLINE_PLAYERS, id));
        const results = await pipeline.exec();

        const onlineFriendIds = friendIds.filter((_, i) => results?.[i]?.[1] === 1);

        // Notify each online friend that this player has gone offline
        await Promise.all(
            onlineFriendIds.map(friendId =>
                emitToPlayer(this.redis, server, friendId, SocketEvents.Friends.Emit.FriendOffline, playerId)
            )
        );
    }
}
