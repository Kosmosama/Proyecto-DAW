import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';
import { SocketEvents } from 'src/common/constants/events.constants';
import { BATTLE_REQUEST_PREFIX, MATCHMAKING_QUEUE, ONLINE_PLAYERS, PLAYER_FRIENDS_PREFIX, PLAYER_INCOMING_REQUESTS, PLAYER_PENDING_REQUESTS } from 'src/common/constants/redis.constants';
import { emitToPlayer } from 'src/common/utils/emit.util';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/teams/teams.service';
import { FriendBattleRequest } from './interfaces/friend-battle-request.interface';
import { MatchmakingEntry } from './interfaces/matchmaking-entry.interface';

@Injectable()
export class MatchmakingService {
    private readonly logger = new Logger(MatchmakingService.name);

    constructor(
        private readonly playerService: PlayerService,
        private readonly teamService: TeamService,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    /**
     * Joins a player to the matchmaking queue.
     * If an opponent is found, both players are notified and matched.
     * If not, the player is added to the queue.
     * @param {number} playerId - The ID of the player joining matchmaking.
     * @param {number} teamId - The ID of the player's team.
     * @param {Server} server - The Socket.IO server instance for emitting events.
     * @return {Promise<void>} No return value.
     */
    async joinMatchmaking(playerId: number, teamId: number, server: Server): Promise<void> {
        const entry: MatchmakingEntry = { playerId, teamId };
        const entryStr = JSON.stringify(entry);

        const alreadyIn = (await this.redis.lrange(MATCHMAKING_QUEUE, 0, -1)).includes(entryStr);
        if (alreadyIn) {
            this.logger.warn(`Player ${playerId} is already in matchmaking`);
            return;
        }

        const opponentStr = await this.redis.lpop(MATCHMAKING_QUEUE);
        if (!opponentStr) {
            await this.redis.rpush(MATCHMAKING_QUEUE, entryStr);
            this.logger.debug(`Player ${playerId} placed in matchmaking queue`);
            return;
        }

        const opponent = JSON.parse(opponentStr) as MatchmakingEntry;
        const matched = await this.tryMatchPlayers(entry, opponent, server);

        if (!matched) await this.redis.rpush(MATCHMAKING_QUEUE, entryStr);
    }

    /**
     * Leaves the matchmaking queue for a player.
     * Removes the player from the queue if they are present.
     * @param {number} playerId - The ID of the player leaving matchmaking.
     * @return {Promise<void>} No return value.
     */
    async leaveMatchmaking(playerId: number): Promise<void> {
        const items = await this.redis.lrange(MATCHMAKING_QUEUE, 0, -1);
        const target = items.find(i => JSON.parse(i).playerId === playerId);
        if (target) await this.redis.lrem(MATCHMAKING_QUEUE, 0, target);
        this.logger.debug(`Player ${playerId} left matchmaking`);
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
            fromTeamId: teamId
        };

        await this.redis.set(key, JSON.stringify(request), 'EX', 30);
        await this.redis.sadd(`${PLAYER_PENDING_REQUESTS}:${from}`, key);
        await this.redis.sadd(`${PLAYER_INCOMING_REQUESTS}:${to}`, key);

        await emitToPlayer(this.redis, server, to, SocketEvents.Battle.Emit.RequestReceived, { from });
        this.logger.debug(`Battle request sent from ${from} to ${to}`);
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
            this.logger.debug(`Battle request from ${from} to ${to} cancelled`);
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

        this.logger.debug(`Friend battle accepted:
            Player ${from} (Team ${request.fromTeamId})  
            vs  
            Player ${to} (Team ${toTeamId})`);

        await emitToPlayer(this.redis, server, from, SocketEvents.Matchmaking.Emit.MatchFound, { opponent: to, mode: 'friend' });
        await emitToPlayer(this.redis, server, to, SocketEvents.Matchmaking.Emit.MatchFound, { opponent: from, mode: 'friend' });
    }

    /**
     * Cleans up all pending and incoming battle requests for a player.
     * Deletes all requests from Redis and logs the cleanup.
     * @param {number} playerId - The ID of the player whose requests are being cleaned up.
     * @return {Promise<void>} No return value.
     */
    async cleanupPlayerRequests(playerId: number): Promise<void> {
        const outgoing = await this.redis.smembers(`${PLAYER_PENDING_REQUESTS}:${playerId}`);
        const incoming = await this.redis.smembers(`${PLAYER_INCOMING_REQUESTS}:${playerId}`);

        const pipeline = this.redis.pipeline();
        [...outgoing, ...incoming].forEach(k => pipeline.del(k));
        pipeline.del(`${PLAYER_PENDING_REQUESTS}:${playerId}`);
        pipeline.del(`${PLAYER_INCOMING_REQUESTS}:${playerId}`);
        await pipeline.exec();

        this.logger.debug(`Cleaned up ${outgoing.length + incoming.length} battle requests for player ${playerId}`);
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

        await emitToPlayer(this.redis, server, p1.playerId, SocketEvents.Matchmaking.Emit.MatchFound, { opponent: p2.playerId, mode: 'matchmaking' });
        await emitToPlayer(this.redis, server, p2.playerId, SocketEvents.Matchmaking.Emit.MatchFound, { opponent: p1.playerId, mode: 'matchmaking' });

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

    // #TODO Create method to GET pending requests? outgoing and incoming
}
