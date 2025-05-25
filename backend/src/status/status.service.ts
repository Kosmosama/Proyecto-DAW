import { SOCKET_TO_PLAYER, PLAYER_SOCKETS_PREFIX, ONLINE_PLAYERS, PLAYER_FRIENDS_PREFIX } from '../config/redis.constants';
import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { PlayerService } from 'src/player/player.service';

@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name);
    private disconnectTimers = new Map<number, NodeJS.Timeout>();

    constructor(
        private readonly playerService: PlayerService,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    /**
     * Registers a new connection for a player.
     * @param {Socket} client The socket client representing the connection.
     * @param {number} playerId The ID of the player.
     * @param {Server} server The Socket.IO server instance.
     * @returns {Promise<void>} No return value.
     */
    async registerConnection(client: Socket, playerId: number, server: Server) {
        await this.redis.hset(SOCKET_TO_PLAYER, client.id, playerId.toString());
        await this.redis.sadd(`${PLAYER_SOCKETS_PREFIX}${playerId}`, client.id);

        if (this.disconnectTimers.has(playerId)) {
            clearTimeout(this.disconnectTimers.get(playerId)!);
            this.disconnectTimers.delete(playerId);
            this.logger.debug(`Cancelled offline timer for player ${playerId} due to new connection.`);
        }

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

        const remaining = await this.redis.scard(`${PLAYER_SOCKETS_PREFIX}${playerId}`);

        if (remaining === 0) {
            this.logger.debug(`Starting offline timer for player ${playerId}`);

            const timer = setTimeout(async () => {
                const stillRemaining = await this.redis.scard(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
                if (stillRemaining === 0) {
                    await this.redis.del(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
                    await this.redis.srem(ONLINE_PLAYERS, playerId.toString());
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

        if (friendIds.length > 0) {
            const friendIdStrings: string[] = friendIds.map(String);
            await this.redis.sadd(`${PLAYER_FRIENDS_PREFIX}${playerId}`, ...friendIdStrings);
        }

        const pipeline = this.redis.pipeline();
        friendIds.forEach(id => {
            pipeline.sismember(ONLINE_PLAYERS, id.toString());
        });

        const results = await pipeline.exec();
        const onlineFriendIds = friendIds.filter((_, i) => results?.[i]?.[1] === 1);

        await this.emitToPlayer(server, playerId, 'friends:online', onlineFriendIds);

        await Promise.all(
            onlineFriendIds.map(id => this.emitToPlayer(server, id, 'friend:online', playerId))
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

        const friendIdStrings = await this.redis.smembers(`${PLAYER_FRIENDS_PREFIX}${playerId}`);
        await this.redis.del(`${PLAYER_FRIENDS_PREFIX}${playerId}`);

        if (friendIdStrings.length === 0) return;

        const friendIds = friendIdStrings.map(id => parseInt(id, 10));

        const pipeline = this.redis.pipeline();
        friendIdStrings.forEach(id => pipeline.sismember(ONLINE_PLAYERS, id));
        
        const results = await pipeline.exec();
        const onlineFriendIds = friendIds.filter((_, i) => results?.[i]?.[1] === 1);

        await Promise.all(
            onlineFriendIds.map(friendId => this.emitToPlayer(server, friendId, 'friend:offline', playerId))
        );
    }

    /**
     * Emits an event to a specific player.
     * @param {Server} server The Socket.IO server instance.
     * @param {number} playerId The ID of the player.
     * @param {string} event The event name to emit.
     * @param {any} data The data to send with the event.
     * @returns {Promise<void>} No return value.
     */
    private async emitToPlayer(server: Server, playerId: number, event: string, data: any) {
        const sockets = await this.redis.smembers(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
        for (const socketId of sockets) {
            server.to(socketId).emit(event, data);
        }
    }
}
