import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';
import { SocketEvents } from 'src/common/constants/events.constants';
import { BATTLE_REQUEST_PREFIX, MATCHMAKING_DATA_PREFIX, MATCHMAKING_PLAYERS, MATCHMAKING_QUEUE, ONLINE_PLAYERS, PLAYER_FRIENDS_PREFIX, PLAYER_INCOMING_REQUESTS, PLAYER_PENDING_REQUESTS } from 'src/common/constants/redis.constants';
import { emitToPlayer } from 'src/common/utils/emit.util';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/teams/teams.service';
import { GameService } from './game.service';
import { FriendBattleRequest } from './interfaces/friend-battle-request.interface';
import { MatchmakingEntry } from './interfaces/matchmaking-entry.interface';

@Injectable()
export class MatchmakingService {
    private readonly logger = new Logger(MatchmakingService.name);

    constructor(
        private readonly playerService: PlayerService,
        private readonly teamService: TeamService,
        private readonly gameService: GameService,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    /**
     * Joins a player to the matchmaking queue.
     * If an opponent is found, it attempts to match them.
     * If no opponent is found, the player is added to the queue.
     * @param {number} playerId - The ID of the player joining matchmaking.
     * @param {number} teamId - The ID of the player's team.
     * @param {Server} server - The Socket.IO server instance for emitting events.
     * @return {Promise<void>} No return value.
     */
    async joinMatchmaking(playerId: number, teamId: number, server: Server): Promise<void> {
        const pid = playerId.toString();
        const alreadyIn = await this.redis.sismember(MATCHMAKING_PLAYERS, pid);
        if (alreadyIn) {
            this.logger.warn(`Player ${playerId} is already in matchmaking`);
            return;
        }

        const opponentIds = await this.redis.zrange(MATCHMAKING_QUEUE, 0, 0);
        if (opponentIds.length === 0) {
            await this.addToQueue(playerId, teamId);
            // this.logger.debug(`Player ${playerId} placed in matchmaking queue`);
            return;
        }

        const opponentId = opponentIds[0];
        const pipeline = this.redis.pipeline();
        pipeline.zrem(MATCHMAKING_QUEUE, opponentId);
        pipeline.srem(MATCHMAKING_PLAYERS, opponentId);
        const opponentDataPromise = this.redis.hget(`${MATCHMAKING_DATA_PREFIX}${opponentId}`, 'teamId');
        pipeline.del(`${MATCHMAKING_DATA_PREFIX}${opponentId}`);
        await pipeline.exec();

        const opponentTeamIdStr = await opponentDataPromise;
        if (!opponentTeamIdStr) {
            this.logger.warn(`Opponent data missing for player ${opponentId}, re-queuing player ${playerId}`);
            await this.addToQueue(playerId, teamId);
            return;
        }

        const opponent: MatchmakingEntry = {
            playerId: parseInt(opponentId, 10),
            teamId: parseInt(opponentTeamIdStr, 10),
        };
        const entry: MatchmakingEntry = { playerId, teamId };

        const matched = await this.tryMatchPlayers(entry, opponent, server);
        if (!matched) {
            await this.leaveMatchmaking(opponent.playerId);
            await this.addToQueue(playerId, teamId);
        }
    }

    /**
     * Leaves the matchmaking queue for a player.
     * Removes the player from the queue and deletes their matchmaking data.
     * @param {number} playerId - The ID of the player leaving matchmaking.
     * @return {Promise<void>} No return value.
     */
    async leaveMatchmaking(playerId: number): Promise<void> {
        const pid = playerId.toString();
        const pipeline = this.redis.pipeline();
        pipeline.zrem(MATCHMAKING_QUEUE, pid);
        pipeline.srem(MATCHMAKING_PLAYERS, pid);
        pipeline.del(`${MATCHMAKING_DATA_PREFIX}${pid}`);
        await pipeline.exec();
        // this.logger.debug(`Player ${playerId} left matchmaking`);
    }

    /**
     * Sends a battle request to another player.
     * Checks friendship status and online status before sending the request.
     * @param {number} from - The ID of the player sending the request.
     * @param {number} to - The ID of the player receiving the request.
     * @param {number} teamId - The ID of the team of the sender.
     * @param {Server} server - The Socket.IO server instance for emitting events.
     * @return {Promise<void>} No return value.
     */
    async sendBattleRequest(from: number, to: number, teamId: number, server: Server): Promise<void> {
        if (from === to) throw new Error('Cannot send battle request to self');
        // this.logger.debug(`Battle request from ${from} to ${to} with team ID ${teamId}`);

        if (!(await this.ensureFriendshipCached(from, to)))
            throw new Error('Players are not friends');

        if (!(await this.redis.sismember(ONLINE_PLAYERS, to.toString())))
            throw new Error('Target player is not online');

        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;
        const revKey = `${BATTLE_REQUEST_PREFIX}${to}:${from}`;
        if ((await this.redis.exists(key)) || (await this.redis.exists(revKey)))
            throw new Error('A pending request already exists');

        const request: FriendBattleRequest = {
            from,
            to,
            fromTeamId: teamId,
        };

        await this.redis.set(key, JSON.stringify(request), 'EX', 30);
        await this.redis.sadd(`${PLAYER_PENDING_REQUESTS}:${from}`, key);
        await this.redis.sadd(`${PLAYER_INCOMING_REQUESTS}:${to}`, key);

        await emitToPlayer(this.redis, server, to, SocketEvents.Battle.Emit.RequestReceived, { from });
        // this.logger.debug(`Battle request sent from ${from} to ${to}`);
    }

    /**
     * Cancels a battle request sent by a player.
     * Removes the request from Redis and notifies the target player.
     * @param {number} from - The ID of the player who sent the request.
     * @param {number} to - The ID of the player who received the request.
     * @param {Server} server - The Socket.IO server instance for emitting events.
     * @return {Promise<void>} No return value.
     */
    async cancelBattleRequest(from: number, to: number, server: Server): Promise<void> {
        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;
        const existed = await this.redis.del(key);

        await this.redis.srem(`${PLAYER_PENDING_REQUESTS}:${from}`, key);
        await this.redis.srem(`${PLAYER_INCOMING_REQUESTS}:${to}`, key);

        if (existed) {
            await emitToPlayer(this.redis, server, to, SocketEvents.Battle.Emit.RequestCancelled, { from });
            // this.logger.debug(`Battle request from ${from} to ${to} cancelled`);
        } else {
            this.logger.warn(`Attempted to cancel non-existent battle request from ${from} to ${to}`);
        }
    }

    /**
     * Accepts a battle request from another player.
     * Validates the request and notifies both players of the match.
     * @param {number} from - The ID of the player accepting the request.
     * @param {number} to - The ID of the player who sent the request.
     * @param {number} toTeamId - The ID of the team of the target player.
     * @param {Server} server - The Socket.IO server instance for emitting events.
     * @return {Promise<void>} No return value.
     */
    async acceptBattleRequest(from: number, to: number, toTeamId: number, server: Server): Promise<void> {
        if (from === to) throw new Error('Cannot accept battle request from self');
        if (!(await this.ensureFriendshipCached(from, to))) throw new Error('Players are not friends');

        const key = `${BATTLE_REQUEST_PREFIX}${from}:${to}`;
        const value = await this.redis.get(key);

        if (!value) {
            await emitToPlayer(this.redis, server, to, SocketEvents.Battle.Emit.RequestExpired, { from });
            throw new Error('Request expired or invalid');
        }

        const request = JSON.parse(value) as FriendBattleRequest;

        await this.redis.del(key);
        await this.redis.srem(`${PLAYER_PENDING_REQUESTS}:${from}`, key);
        await this.redis.srem(`${PLAYER_INCOMING_REQUESTS}:${to}`, key);

        const [fromOnline, toOnline] = await Promise.all([
            this.redis.sismember(ONLINE_PLAYERS, from.toString()),
            this.redis.sismember(ONLINE_PLAYERS, to.toString()),
        ]);
        if (!fromOnline || !toOnline) throw new Error('One or both players are not available');

        const [fromTeam, toTeam] = await Promise.all([
            this.teamService.findOne(from, request.fromTeamId),
            this.teamService.findOne(to, toTeamId),
        ]);

        // this.logger.debug(`Friend battle accepted:
        //     Player ${from} (Team ${request.fromTeamId})  
        //     vs  
        //     Player ${to} (Team ${toTeamId})`);

        this.gameService.createMatch(
            from,
            request.fromTeamId,
            to,
            toTeamId,
            server,
        );
    }

    /**
     * Cleans up all pending and incoming battle requests for a player.
     * Deletes all requests from Redis and logs the cleanup.
     * @param {number} playerId - The ID of the player whose requests are being cleaned up.
     * @return {Promise<void>} No return value.
     */
    async cleanupPlayerRequests(playerId: number): Promise<void> {
        const pid = playerId.toString();
        const outgoing = await this.redis.smembers(`${PLAYER_PENDING_REQUESTS}:${pid}`);
        const incoming = await this.redis.smembers(`${PLAYER_INCOMING_REQUESTS}:${pid}`);

        const pipeline = this.redis.pipeline();
        [...outgoing, ...incoming].forEach(k => pipeline.del(k));
        pipeline.del(`${PLAYER_PENDING_REQUESTS}:${pid}`);
        pipeline.del(`${PLAYER_INCOMING_REQUESTS}:${pid}`);
        await pipeline.exec();

        // this.logger.debug(`Cleaned up ${outgoing.length + incoming.length} battle requests for player ${playerId}`);
    }

    private async addToQueue(playerId: number, teamId: number): Promise<void> {
        const pid = playerId.toString();
        const now = Date.now();
        const pipeline = this.redis.pipeline();
        pipeline.zadd(MATCHMAKING_QUEUE, now, pid);
        pipeline.hset(`${MATCHMAKING_DATA_PREFIX}${pid}`, 'teamId', teamId.toString());
        pipeline.sadd(MATCHMAKING_PLAYERS, pid);
        await pipeline.exec();
        // this.logger.debug(`Added player ${playerId} to matchmaking queue`);
    }

    /**
     * Attempts to match two players in the matchmaking queue.
     * Checks if both players are online and their teams are valid.
     * If successful, notifies both players of the match.
     * @param {MatchmakingEntry} p1 - The first player entry.
     * @param {MatchmakingEntry} p2 - The second player entry.
     * @param {Server} server - The Socket.IO server instance for emitting events.
     * @return {Promise<boolean>} Returns true if players were matched, false otherwise.
     */
    private async tryMatchPlayers(p1: MatchmakingEntry, p2: MatchmakingEntry, server: Server): Promise<boolean> {
        const [p1Online, p2Online] = await Promise.all([
            this.redis.sismember(ONLINE_PLAYERS, p1.playerId.toString()),
            this.redis.sismember(ONLINE_PLAYERS, p2.playerId.toString()),
        ]);

        if (!p1Online || !p2Online) {
            const offline = !p1Online ? p1 : p2;
            const online = p1Online ? p1 : p2;

            await this.leaveMatchmaking(offline.playerId);
            await this.addToQueue(online.playerId, online.teamId);
            return false;
        }

        const [team1, team2] = await Promise.all([
            this.teamService.findOne(p1.playerId, p1.teamId),
            this.teamService.findOne(p2.playerId, p2.teamId),
        ]);

        // this.logger.debug(`MATCH READY:
        //     Player ${p1.playerId} Team: ${JSON.stringify(team1.data, null, 2)}
        //     /VS/
        //     Player ${p2.playerId} Team: ${JSON.stringify(team2.data, null, 2)}`);

        this.gameService.createMatch(
            p1.playerId,
            p1.teamId,
            p2.playerId,
            p2.teamId,
            server,
        );

        return true;
    }

    /**
     * Ensures that a friendship between two players is cached in Redis.
     * Checks if the friendship exists in Redis, and if not, verifies it via the player service.
     * @param {number} from - The ID of the player initiating the check.
     * @param {number} to - The ID of the player being checked.
     * @return {Promise<boolean>} Returns true if they are friends, false otherwise.
     */
    private async ensureFriendshipCached(from: number, to: number): Promise<boolean> {
        const key = `${PLAYER_FRIENDS_PREFIX}${from}`;
        const cached = await this.redis.sismember(key, to.toString());
        if (cached) return true;

        const areFriends = await this.playerService.areFriends(from, to);
        if (areFriends) await this.redis.sadd(key, to.toString());
        return areFriends;
    }
}