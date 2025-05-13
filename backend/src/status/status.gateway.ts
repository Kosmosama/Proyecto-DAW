import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlayerService } from 'src/player/player.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@WebSocketGateway({ namespace: 'status', cors: { origin: '*' } })
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly playerService: PlayerService,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(StatusGateway.name);

    private ONLINE_PLAYERS = 'status:onlinePlayers';
    private PLAYER_SOCKETS_PREFIX = 'status:playerSockets:';
    private SOCKET_TO_PLAYER = 'status:socketToPlayer';
    private PLAYER_FRIENDS_PREFIX = 'status:playerFriends:';

    async handleConnection(client: Socket) {
        const playerId = this.extractPlayerId(client);
        if (!playerId) {
            client.disconnect();
            return;
        }

        this.logger.debug(`Player ${playerId} connected with socket ${client.id}`);

        await this.redis.hset(this.SOCKET_TO_PLAYER, client.id, playerId.toString());
        await this.redis.sadd(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`, client.id);

        const isOnline = await this.redis.sismember(this.ONLINE_PLAYERS, playerId.toString());
        if (!isOnline) {
            await this.redis.sadd(this.ONLINE_PLAYERS, playerId.toString());
            await this.notifyOnline(playerId);
        }
    }

    async handleDisconnect(client: Socket) {
        const playerIdStr = await this.redis.hget(this.SOCKET_TO_PLAYER, client.id);
        if (!playerIdStr) return;

        const playerId = parseInt(playerIdStr, 10);
        this.logger.debug(`Player ${playerId} disconnected socket ${client.id}`);

        await this.playerService.updateLastLogin(playerId);

        await this.redis.hdel(this.SOCKET_TO_PLAYER, client.id);
        await this.redis.srem(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`, client.id);

        const sockets = await this.redis.smembers(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`);
        if (sockets.length === 0) {
            await this.redis.del(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`);
            await this.redis.srem(this.ONLINE_PLAYERS, playerId.toString());
            await this.notifyOffline(playerId);
        }
    }

    private async notifyOnline(playerId: number) {
        const friends = await this.playerService.getFriends(playerId);
        const friendIds = (friends?.data ?? []).map((f) => f.id);

        if (friendIds.length > 0) {
            await this.redis.sadd(
                `${this.PLAYER_FRIENDS_PREFIX}${playerId}`,
                ...friendIds.map(String),
            );
        }

        const onlineFriendIds: number[] = [];

        for (const id of friendIds) {
            const isOnline = await this.redis.sismember(this.ONLINE_PLAYERS, id.toString());
            if (isOnline) {
                onlineFriendIds.push(id);
            }
        }

        this.emitToPlayer(playerId, 'friends:online', onlineFriendIds);

        for (const id of onlineFriendIds) {
            this.emitToPlayer(id, 'friend:online', playerId);
        }
    }

    private async notifyOffline(playerId: number) {
        const friendIds = await this.redis.smembers(`${this.PLAYER_FRIENDS_PREFIX}${playerId}`);
        await this.redis.del(`${this.PLAYER_FRIENDS_PREFIX}${playerId}`);

        for (const id of friendIds) {
            const friendId = parseInt(id, 10);
            const isOnline = await this.redis.sismember(this.ONLINE_PLAYERS, friendId.toString());
            if (isOnline) {
                this.emitToPlayer(friendId, 'friend:offline', playerId);
            }
        }
    }

    private async emitToPlayer(playerId: number, event: string, data: any) {
        const sockets = await this.redis.smembers(`${this.PLAYER_SOCKETS_PREFIX}${playerId}`);
        for (const socketId of sockets) {
            this.server.to(socketId).emit(event, data);
        }
    }

    private extractPlayerId(client: Socket): number | null {
        const id = client.handshake.query?.playerId;
        return typeof id === 'string' ? parseInt(id, 10) : null;
    }
}
