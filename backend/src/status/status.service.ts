import { Injectable } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { PlayerService } from 'src/player/player.service';

@Injectable()
export class StatusService {
    private ONLINE_PLAYERS = 'status:onlinePlayers';
    private PLAYER_SOCKETS_PREFIX = 'status:playerSockets:';
    private SOCKET_TO_PLAYER = 'status:socketToPlayer';
    private PLAYER_FRIENDS_PREFIX = 'status:playerFriends:';

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
        await this.redis.hset(this.SOCKET_TO_PLAYER, client.id, playerId.toString());
        await this.redis.sadd(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`, client.id);

        const isOnline = await this.redis.sismember(this.ONLINE_PLAYERS, playerId.toString());
        if (!isOnline) {
            await this.redis.sadd(this.ONLINE_PLAYERS, playerId.toString());
            await this.notifyOnline(playerId, server);
        }
    }

    /**
     * Handles disconnection of a player.
     * @param {Socket} client The socket client representing the connection.
     * @param {Server} server The Socket.IO server instance.
     * @returns {Promise<number | null>} The ID of the player if found, otherwise null.
     */
    async handleDisconnection(client: Socket, server: Server): Promise<number | null> {
        const playerIdStr = await this.redis.hget(this.SOCKET_TO_PLAYER, client.id);
        if (!playerIdStr) return null;

        const playerId = parseInt(playerIdStr, 10);
        await this.playerService.updateLastLogin(playerId);

        await this.redis.hdel(this.SOCKET_TO_PLAYER, client.id);
        await this.redis.srem(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`, client.id);

        const remainingSockets = await this.redis.smembers(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`);
        if (remainingSockets.length === 0) {
            await this.redis.del(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`);
            await this.redis.srem(this.ONLINE_PLAYERS, playerId.toString());
            await this.notifyOffline(playerId, server);
        }

        return playerId;
    }

    /**
     * Notifies friends of a player when they come online.
     * @param {number} playerId The ID of the player.
     * @param {Server} server The Socket.IO server instance.
     * @returns {Promise<void>} No return value.
     */
    private async notifyOnline(playerId: number, server: Server): Promise<void> {
        const friends = await this.playerService.getFriends(playerId);
        const friendIds: number[] = (friends?.data ?? []).map((f: { id: number }) => f.id);

        if (friendIds.length > 0) {
            const friendIdStrings: string[] = friendIds.map(String);
            await this.redis.sadd(`${this.PLAYER_FRIENDS_PREFIX}${playerId}`, ...friendIdStrings);
        }

        const onlineFriendIds: number[] = [];

        for (const id of friendIds) {
            const isOnline: boolean = await this.redis.sismember(this.ONLINE_PLAYERS, id.toString()) === 1;
            if (isOnline) {
                onlineFriendIds.push(id);
            }
        }

        await this.emitToPlayer(server, playerId, 'friends:online', onlineFriendIds);

        for (const id of onlineFriendIds) {
            await this.emitToPlayer(server, id, 'friend:online', playerId);
        }
    }

    /**
     * Notifies friends of a player when they go offline.
     * @param {number} playerId The ID of the player.
     * @param {Server} server The Socket.IO server instance.
     * @returns {Promise<void>} No return value.
     */
    private async notifyOffline(playerId: number, server: Server) {
        const friendIds = await this.redis.smembers(`${this.PLAYER_FRIENDS_PREFIX}${playerId}`);
        await this.redis.del(`${this.PLAYER_FRIENDS_PREFIX}${playerId}`);

        for (const id of friendIds) {
            const friendId = parseInt(id, 10);
            const isOnline = await this.redis.sismember(this.ONLINE_PLAYERS, friendId.toString());
            if (isOnline) {
                this.emitToPlayer(server, friendId, 'friend:offline', playerId);
            }
        }
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
        const sockets = await this.redis.smembers(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`);
        for (const socketId of sockets) {
            server.to(socketId).emit(event, data);
        }
    }
}
