import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';
import { emitToPlayer } from 'src/common/utils/emit.util';
import { BATTLE_REQUEST_PREFIX, MATCHMAKING_QUEUE, ONLINE_PLAYERS, PLAYER_FRIENDS_PREFIX, PLAYER_PENDING_REQUESTS } from 'src/config/redis.constants';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/teams/teams.service';

interface BattleRequest {
    playerId: number;
    teamId: number;
}

@Injectable()
export class MatchmakingService {
    private readonly logger = new Logger(MatchmakingService.name);

    constructor(
        private readonly playerService: PlayerService,
        private readonly teamService: TeamService,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    async joinMatchmaking(playerId: number, teamId: number, server: Server): Promise<void> {
        const inQueue = await this.redis.lrange(MATCHMAKING_QUEUE, 0, -1);
        const playerKey = JSON.stringify({ playerId, teamId });

        if (inQueue.includes(playerKey)) {
            this.logger.warn(`Player ${playerId} is already in matchmaking`);
            return;
        }

        const opponentEntry = await this.redis.lpop(MATCHMAKING_QUEUE);

        if (opponentEntry) {
            const opponent = JSON.parse(opponentEntry) as BattleRequest;
            const matched = await this.tryMatchPlayers(
                { playerId, teamId },
                opponent,
                server
            );

            if (!matched) {
                await this.redis.rpush(MATCHMAKING_QUEUE, playerKey);
            }
        } else {
            await this.redis.rpush(MATCHMAKING_QUEUE, playerKey);
            this.logger.debug(`Player ${playerId} placed in matchmaking queue`);
        }
    }

    async leaveMatchmaking(playerId: number): Promise<void> {
        await this.redis.lrem(MATCHMAKING_QUEUE, 0, playerId.toString());
        this.logger.debug(`Player ${playerId} left matchmaking`);
    }

    async sendBattleRequest(from: number, to: number, teamId: number, server: Server): Promise<void> {
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

        await this.redis.set(fwdKey, teamId.toString(), 'EX', 30); // store teamId in value
        await this.redis.sadd(`${PLAYER_PENDING_REQUESTS}${from}`, fwdKey);

        await emitToPlayer(this.redis, server, to, 'battle:request:received', { from });

        this.logger.debug(`Battle request sent from ${from} to ${to}`);
    }

    async cancelBattleRequest(from: number, to: number, server: Server): Promise<void> {
        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;

        const existed = await this.redis.del(key);
        await this.redis.srem(`${PLAYER_PENDING_REQUESTS}${from}`, key);

        if (existed) {
            await emitToPlayer(this.redis, server, to, 'battle:request:cancelled', { from });
            this.logger.debug(`Battle request from ${from} to ${to} cancelled`);
        } else {
            this.logger.warn(`Attempted to cancel non-existent battle request from ${from} to ${to}`);
        }
    }

    async acceptBattleRequest(from: number, to: number, teamId: number, server: Server): Promise<void> {
        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;
        const fromTeamIdStr = await this.redis.get(key);

        if (!fromTeamIdStr) throw new Error('Request expired or invalid');

        await this.redis.del(key);
        await this.redis.srem(`${PLAYER_PENDING_REQUESTS}${from}`, key);

        const [fromOnline, toOnline] = await Promise.all([
            this.redis.sismember(ONLINE_PLAYERS, from.toString()),
            this.redis.sismember(ONLINE_PLAYERS, to.toString()),
        ]);

        if (!fromOnline || !toOnline) throw new Error('One or both players are not available');

        const fromTeamId = parseInt(fromTeamIdStr, 10);
        const [fromTeam, toTeam] = await Promise.all([
            this.teamService.findOne(from, fromTeamId),
            this.teamService.findOne(to, teamId),
        ]);

        this.logger.debug(`Friend battle match accepted:
        Player ${from} (Team: ${fromTeamId})
        vs
        Player ${to} (Team: ${teamId})`);

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

    private async tryMatchPlayers(p1: BattleRequest, p2: BattleRequest, server: Server): Promise<boolean> {
        const [p1Online, p2Online] = await Promise.all([
            this.redis.sismember(ONLINE_PLAYERS, p1.playerId.toString()),
            this.redis.sismember(ONLINE_PLAYERS, p2.playerId.toString()),
        ]);

        if (!p1Online || !p2Online) {
            const offline = !p1Online ? p1 : p2;
            const online = p1Online ? p1 : p2;

            await this.leaveMatchmaking(offline.playerId);
            await this.redis.rpush(MATCHMAKING_QUEUE, JSON.stringify(online));
            return false;
        }

        const [team1, team2] = await Promise.all([
            this.teamService.findOne(p1.playerId, p1.teamId),
            this.teamService.findOne(p2.playerId, p2.teamId),
        ]);

        this.logger.debug(`MATCH READY:
            Player ${p1.playerId} Team: ${JSON.stringify(team1.data, null, 2)}
            /VS/
            Player ${p2.playerId} Team: ${JSON.stringify(team2.data, null, 2)}`);

        await emitToPlayer(this.redis, server, p1.playerId, 'match:found', { opponent: p2.playerId, mode: 'matchmaking' });
        await emitToPlayer(this.redis, server, p2.playerId, 'match:found', { opponent: p1.playerId, mode: 'matchmaking' });

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
