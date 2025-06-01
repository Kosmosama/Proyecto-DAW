import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';
import { BATTLE_REQUEST_PREFIX, MATCHMAKING_QUEUE, ONLINE_PLAYERS, PLAYER_FRIENDS_PREFIX, PLAYER_PENDING_REQUESTS } from 'src/config/redis.constants';
import { PlayerService } from 'src/player/player.service';
import { StatusService } from './status.service';
import { emitToPlayer } from 'src/common/utils/emit.util';

@Injectable()
export class MatchmakingService {
    private readonly logger = new Logger(MatchmakingService.name);

    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly playerService: PlayerService,
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
        if (from === to) throw new Error("Cannot send battle request to self");

        const areFriends = await this.ensureFriendshipCached(from, to);
        if (!areFriends) throw new Error("Players are not friends");

        const isOnline = await this.redis.sismember(ONLINE_PLAYERS, to.toString());
        if (!isOnline) throw new Error("Target player is not online");

        const [fwdKey, revKey] = this.getBattleRequestKeys(from, to);
        const [fwdExists, revExists] = await Promise.all([
            this.redis.exists(fwdKey),
            this.redis.exists(revKey),
        ]);
        if (fwdExists || revExists) throw new Error("A pending request already exists");

        await this.redis.set(fwdKey, 'pending', 'EX', 30);
        await this.redis.sadd(`${PLAYER_PENDING_REQUESTS}${from}`, fwdKey);

        await emitToPlayer(this.redis, server, to, 'battle:request:received', { from });
        this.logger.debug(`Battle request sent from ${from} to ${to}`);
    }

    async cancelBattleRequest(from: number, to: number, server: Server): Promise<void> {
        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;
        await this.redis.del(key);
        await this.redis.srem(`${PLAYER_PENDING_REQUESTS}${from}`, key);

        await emitToPlayer(this.redis, server, to, 'battle:request:cancelled', { from });

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

        await emitToPlayer(this.redis, server, from, 'match:found', { opponent: to, mode: 'friend' });
        await emitToPlayer(this.redis, server, to, 'match:found', { opponent: from, mode: 'friend' });
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

        await emitToPlayer(this.redis, server, player1, 'match:found', { opponent: player2, mode: 'matchmaking' });
        await emitToPlayer(this.redis, server, player2, 'match:found', { opponent: player1, mode: 'matchmaking' });

        this.logger.debug(`Friend battle match: Player ${player1} /vs/ Player ${player2}`);
        return true;
    }

    private async ensureFriendshipCached(from: number, to: number): Promise<boolean> {
        const key = `${PLAYER_FRIENDS_PREFIX}${from}`;
        const cached = await this.redis.sismember(key, to.toString());
        if (cached) return true;

        const areFriends = await this.playerService.areFriends(from, to);
        if (areFriends) await this.redis.sadd(key, to.toString());
        return areFriends;
    }

    private getBattleRequestKeys(from: number, to: number): [string, string] {
        return [
            `${BATTLE_REQUEST_PREFIX}${from}:${to}`,
            `${BATTLE_REQUEST_PREFIX}${to}:${from}`,
        ];
    }
}
