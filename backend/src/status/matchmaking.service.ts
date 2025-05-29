import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';
import { PlayerService } from 'src/player/player.service';
import { StatusService } from './status.service';

// #TODO Move to redis constants
const MATCHMAKING_QUEUE = 'matchmaking:queue';
const BATTLE_REQUEST_PREFIX = 'battle:request:';
const PLAYER_PENDING_REQUESTS = 'player:pending:requests:';
const ONLINE_PLAYERS = 'online:players';

@Injectable()
export class MatchmakingService {
    private readonly logger = new Logger(MatchmakingService.name);

    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly playerService: PlayerService,
        private readonly statusService: StatusService,
    ) { }

    async joinMatchmaking(playerId: number, server: Server): Promise<void> {
        const alreadyInQueue = await this.redis.lrange(MATCHMAKING_QUEUE, 0, -1);
        if (alreadyInQueue.includes(playerId.toString())) {
            this.logger.warn(`Player ${playerId} is already in matchmaking`);
            return;
        }

        await this.redis.rpush(MATCHMAKING_QUEUE, playerId);
        this.logger.debug(`Player ${playerId} joined matchmaking`);

        const queue = await this.redis.lrange(MATCHMAKING_QUEUE, 0, -1);
        while (queue.length >= 2) {
            const p1 = parseInt(queue.shift()!);
            const p2 = parseInt(queue.shift()!);

            const [p1Online, p2Online] = await Promise.all([
                this.redis.sismember(ONLINE_PLAYERS, p1.toString()),
                this.redis.sismember(ONLINE_PLAYERS, p2.toString())
            ]);

            if (p1Online && p2Online) {
                await this.redis.ltrim(MATCHMAKING_QUEUE, 2, -1);

                // Notify players
                await this.statusService.emitToPlayer(server, p1, 'match:found', { opponent: p2, mode: 'matchmaking' });
                await this.statusService.emitToPlayer(server, p2, 'match:found', { opponent: p1, mode: 'matchmaking' });

                this.logger.debug(`Matchmaking: Player ${p1} vs Player ${p2}`);
            } else {
                // Requeue if one is offline
                if (p1Online) await this.redis.rpush(MATCHMAKING_QUEUE, p1);
                if (p2Online) await this.redis.rpush(MATCHMAKING_QUEUE, p2);
                break;
            }
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

        const fromSockets = await this.redis.smembers(`player:sockets:${from}`);
        const toSockets = await this.redis.smembers(`player:sockets:${to}`);

        this.logger.debug(`Friend battle match: Player ${from} (${fromSockets[0]}) /vs/ Player ${to} (${toSockets[0]})`);

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
}
