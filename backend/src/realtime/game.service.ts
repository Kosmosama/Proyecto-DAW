import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Namespace, Server } from 'socket.io';
import { SocketEvents } from 'src/common/constants/events.constants';
import { PLAYER_SOCKETS_PREFIX } from 'src/common/constants/redis.constants';
import { emitToPlayer } from 'src/common/utils/emit.util';
import { v4 as uuidv4 } from 'uuid';

const MATCH_PREFIX = 'game:match:';
const PLAYER_MATCHES_PREFIX = 'game:playerMatches:';

interface MatchRoomData {
    id: string;
    playerA: { id: number; teamId: number };
    playerB: { id: number; teamId: number };
}

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);

    constructor(
        @InjectRedis() private readonly redis: Redis,
    ) { }

    async createMatch(playerAId: number, teamAId: number, playerBId: number, teamBId: number, server: Server): Promise<void> {
        const roomId = uuidv4();
        const roomKey = `${MATCH_PREFIX}${roomId}`;

        const match: MatchRoomData = {
            id: roomId,
            playerA: { id: playerAId, teamId: teamAId },
            playerB: { id: playerBId, teamId: teamBId },
        };

        await this.redis.set(roomKey, JSON.stringify(match));
        await this.redis.sadd(`${PLAYER_MATCHES_PREFIX}${playerAId}`, roomId);
        await this.redis.sadd(`${PLAYER_MATCHES_PREFIX}${playerBId}`, roomId);

        // Join sockets to the room
        await Promise.all([
            this.joinPlayerToRoom(this.redis, server, playerAId, roomId),
            this.joinPlayerToRoom(this.redis, server, playerBId, roomId),
        ]);

        // Notify players of the match
        await Promise.all([
            emitToPlayer(this.redis, server, playerAId, SocketEvents.Matchmaking.Emit.MatchFound, match),
            emitToPlayer(this.redis, server, playerBId, SocketEvents.Matchmaking.Emit.MatchFound, match),
        ]);

        this.logger.debug(`Match created for player ${playerAId} and player ${playerBId} in the room with id ${roomId}`);
    }

    async restoreActiveMatches(playerId: number, server: Server): Promise<void> {
        const matchIds = await this.redis.smembers(`${PLAYER_MATCHES_PREFIX}${playerId}`);

        for (const roomId of matchIds) {
            const raw = await this.redis.get(`${MATCH_PREFIX}${roomId}`);
            if (!raw) continue;

            const match: MatchRoomData = JSON.parse(raw);

            await this.joinPlayerToRoom(this.redis, server, playerId, roomId);
            await emitToPlayer(this.redis, server, playerId, SocketEvents.Matchmaking.Emit.MatchFound, match);
        }

        this.logger.debug(`Matches restored for player ${playerId}`);
    }

    async handlePlayerDisconnect(playerId: number, server: Server): Promise<void> {
        const matchIds = await this.redis.smembers(`${PLAYER_MATCHES_PREFIX}${playerId}`);

        for (const roomId of matchIds) {
            const matchRaw = await this.redis.get(`${MATCH_PREFIX}${roomId}`);
            if (!matchRaw) continue;

            const match: MatchRoomData = JSON.parse(matchRaw);
            const opponentId = match.playerA.id === playerId ? match.playerB.id : match.playerA.id;

            server.to(roomId).emit(SocketEvents.Game.Emit.MatchForfeit, {
                roomId,
                winner: opponentId,
                reason: 'Opponent disconnected',
            });

            await this.redis.del(`${MATCH_PREFIX}${roomId}`);
            await this.redis.srem(`${PLAYER_MATCHES_PREFIX}${playerId}`, roomId);
            await this.redis.srem(`${PLAYER_MATCHES_PREFIX}${opponentId}`, roomId);
        }

        this.logger.debug(`Lost all concurrent matches for player ${playerId}`);
    }

    async handleChatMessage(server: Server, playerId: number, roomId: string, message: string): Promise<void> {
        this.logger.debug(`Player ${playerId} sent the message: ${message}`);

        if (message.trim().toUpperCase() !== 'WIN') return;

        const matchKey = `${MATCH_PREFIX}${roomId}`;
        const matchRaw = await this.redis.get(matchKey);
        if (!matchRaw) return;

        const match: MatchRoomData = JSON.parse(matchRaw);
        const isInMatch = [match.playerA.id, match.playerB.id].includes(playerId);
        if (!isInMatch) return;

        await this.reportWinner(server, roomId, playerId);
    }

    private async reportWinner(server: Server, roomId: string, winnerId: number): Promise<void> {
        const key = `${MATCH_PREFIX}${roomId}`;
        const raw = await this.redis.get(key);
        if (!raw) return;

        const match: MatchRoomData = JSON.parse(raw);
        const players = [match.playerA.id, match.playerB.id];

        await this.redis.del(key);
        await this.redis.srem(`${PLAYER_MATCHES_PREFIX}${players[0]}`, roomId);
        await this.redis.srem(`${PLAYER_MATCHES_PREFIX}${players[1]}`, roomId);

        server.to(roomId).emit(SocketEvents.Game.Emit.MatchEnd, {
            winner: winnerId,
            roomId,
        });

        this.logger.debug(`Match ${roomId} completed. Winner: ${winnerId}, Team: ${winnerId === match.playerA.id ? match.playerA.teamId : match.playerB.teamId}`);
    }

    private async joinPlayerToRoom(redis: Redis, server: Server, playerId: number, roomId: string) {
        const socketIds = await redis.smembers(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
        if (!socketIds.length) return;

        const socketsMap = await server.in(socketIds).fetchSockets();

        for (const socket of socketsMap) {
            socket.join(roomId);
            this.logger.debug(`Player ${playerId}'s socket ${socket.id} joined room ${roomId}`);
        }
    }
}
