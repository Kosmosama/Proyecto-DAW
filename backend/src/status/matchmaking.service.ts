import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';
import { PlayerService } from 'src/player/player.service';
import { StatusService } from './status.service';
import { BATTLE_REQUEST_PREFIX, MATCHMAKING_QUEUE, ONLINE_PLAYERS, PLAYER_PENDING_REQUESTS } from 'src/config/redis.constants';

@Injectable()
export class MatchmakingService {
    private readonly logger = new Logger(MatchmakingService.name);

    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly playerService: PlayerService,
        private readonly statusService: StatusService,
    ) { }

    async joinMatchmaking(playerId: number, server: Server): Promise<void> {
        const inQueue = await this.redis.lrange(MATCHMAKING_QUEUE, 0, -1);
        if (inQueue.includes(playerId.toString())) {
            this.logger.warn(`Player ${playerId} is already in matchmaking`);
            return;
        }

        const otherPlayerIdStr = await this.redis.lpop(MATCHMAKING_QUEUE);

        if (otherPlayerIdStr) {
            const otherPlayerId = parseInt(otherPlayerIdStr);
            const matched = await this.tryMatchPlayers(playerId, otherPlayerId, server);

            if (!matched) {
                // One of them was offline. Retry matchmaking for the current player.
                await this.redis.rpush(MATCHMAKING_QUEUE, playerId.toString());
            }
        } else {
            await this.redis.rpush(MATCHMAKING_QUEUE, playerId.toString());
            this.logger.debug(`Player ${playerId} placed in matchmaking queue`);
        }
    }

    async leaveMatchmaking(playerId: number): Promise<void> {
        await this.redis.lrem(MATCHMAKING_QUEUE, 0, playerId.toString());
        this.logger.debug(`Player ${playerId} left matchmaking`);
    }

    async sendBattleRequest(from: number, to: number, server: Server): Promise<void> {
        const areFriends = await this.playerService.areFriends(from, to);
        const toOnline = await this.redis.sismember(ONLINE_PLAYERS, to.toString());

        if (!areFriends) throw new Error('Not friends');
        if (!toOnline) throw new Error('Target player is not online');

        const reverseKey = `${BATTLE_REQUEST_PREFIX}${to}:${from}`;
        const exists = await this.redis.exists(reverseKey);
        if (exists) throw new Error('Mutual battle request exists');

        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;
        const ttl = 30;

        await this.redis.set(key, 'pending', 'EX', ttl);
        await this.redis.sadd(`${PLAYER_PENDING_REQUESTS}${from}`, key);

        await this.statusService.emitToPlayer(server, to, 'battle:request:received', { from });

        this.logger.debug(`Battle request sent from ${from} to ${to}`);
    }

    async cancelBattleRequest(from: number, to: number, server: Server): Promise<void> {
        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;
        await this.redis.del(key);
        await this.redis.srem(`${PLAYER_PENDING_REQUESTS}${from}`, key);

        await this.statusService.emitToPlayer(server, to, 'battle:request:cancelled', { from });

        this.logger.debug(`Battle request from ${from} to ${to} cancelled`);
    }

    async acceptBattleRequest(from: number, to: number, server: Server): Promise<void> {
        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;
        const exists = await this.redis.exists(key);
        if (!exists) throw new Error('Request expired or invalid');

        await this.redis.del(key);
        await this.redis.srem(`${PLAYER_PENDING_REQUESTS}${from}`, key);

        const [fromOnline, toOnline] = await Promise.all([
            this.redis.sismember(ONLINE_PLAYERS, from.toString()),
            this.redis.sismember(ONLINE_PLAYERS, to.toString()),
        ]);
        if (!fromOnline || !toOnline) throw new Error('One or both players are not available');

        this.logger.debug(`Friend battle match: Player {from} ${from}  /vs/ {to} Player ${to}`);

        await this.statusService.emitToPlayer(server, from, 'match:found', { opponent: to, mode: 'friend' });
        await this.statusService.emitToPlayer(server, to, 'match:found', { opponent: from, mode: 'friend' });
    }

    async cleanupPlayerRequests(playerId: number): Promise<void> {
        const keys = await this.redis.smembers(`${PLAYER_PENDING_REQUESTS}${playerId}`);
        if (keys.length) {
            const pipeline = this.redis.pipeline();
            keys.forEach(k => pipeline.del(k));
            pipeline.del(`${PLAYER_PENDING_REQUESTS}${playerId}`);
            await pipeline.exec();
            this.logger.debug(`Cleaned up ${keys.length} battle requests for player ${playerId}`);
        }
    }

    private async tryMatchPlayers(player1: number, player2: number, server: Server): Promise<boolean> {
        const [p1Online, p2Online] = await Promise.all([
            this.redis.sismember(ONLINE_PLAYERS, player1.toString()),
            this.redis.sismember(ONLINE_PLAYERS, player2.toString()),
        ]);

        if (!p1Online || !p2Online) {
            const offlinePlayer = !p1Online ? player1 : player2;
            await this.leaveMatchmaking(offlinePlayer);
            this.logger.debug(`Match failed: Player ${offlinePlayer} is offline. Requeuing other.`);

            // Requeue the player who is still online
            const onlinePlayer = p1Online ? player1 : player2;
            await this.redis.rpush(MATCHMAKING_QUEUE, onlinePlayer.toString());
            return false;
        }

        await this.statusService.emitToPlayer(server, player1, 'match:found', { opponent: player2, mode: 'matchmaking' });
        await this.statusService.emitToPlayer(server, player2, 'match:found', { opponent: player1, mode: 'matchmaking' });

        this.logger.debug(`Friend battle match: Player ${player1} /vs/ Player ${player2}`);
        return true;
    }
}
