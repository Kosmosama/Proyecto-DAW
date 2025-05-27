import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

// #TODO Move later to .interface.ts
export interface GameRoom {
    matchId: string;
    players: Set<number>;
    disconnectedPlayers: Map<number, number>; // playerId -> remainingGraceTime (ms)
    graceTimeouts: Map<number, NodeJS.Timeout>; // playerId -> timeout ref
    winner?: number;
}

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);

    private activeMatches: Map<string, GameRoom> = new Map();
    private readonly GAME_GRACE_MS = 60_000;

    async joinMatch(client: Socket, matchId: string, playerId: number) {
        client.join(matchId);
        client.data.matchId = matchId;
        client.data.playerId = playerId;

        this.logger.debug(`Player ${playerId} joined match ${matchId}`);

        if (!this.activeMatches.has(matchId)) {
            this.activeMatches.set(matchId, {
                matchId,
                players: new Set(),
                disconnectedPlayers: new Map(),
                graceTimeouts: new Map(),
            });
        }

        const room = this.activeMatches.get(matchId)!;
        room.players.add(playerId);

        // If rejoining during grace period
        if (room.disconnectedPlayers.has(playerId)) {
            const remainingTime = room.disconnectedPlayers.get(playerId)!;
            clearTimeout(room.graceTimeouts.get(playerId)!);
            room.disconnectedPlayers.delete(playerId);
            room.graceTimeouts.delete(playerId);

            this.logger.debug(`Player ${playerId} reconnected to ${matchId}. Time left was ${remainingTime}ms.`);

            client.to(matchId).emit('player:reconnected', { playerId });
        }
    }

    async handlePlayerDisconnect(client: Socket, server: Server) {
        const playerId = client.data.playerId;
        const matchId = client.data.matchId;

        if (!matchId || !playerId) return;

        const room = this.activeMatches.get(matchId);
        if (!room || room.winner) return;

        // Avoid false disconnect if multiple sockets are active
        const sockets = await this.getSocketIdsForPlayer(server, playerId);
        const stillConnected = sockets.filter(sid => sid !== client.id).length;
        if (stillConnected > 0) {
            this.logger.debug(`Player ${playerId} has other active sockets in match ${matchId}`);
            return;
        }

        // Already disconnected?
        if (room.disconnectedPlayers.has(playerId)) return;

        this.logger.debug(`Player ${playerId} fully disconnected from ${matchId}. Starting grace timer.`);

        const timeout = setTimeout(() => {
            const isStillDisconnected = room.disconnectedPlayers.has(playerId);
            if (!isStillDisconnected) return;

            room.players.delete(playerId);
            room.disconnectedPlayers.delete(playerId);
            room.graceTimeouts.delete(playerId);

            const [remainingPlayerId] = [...room.players];
            room.winner = remainingPlayerId;

            server.to(matchId).emit('match:youWon', { matchId, winnerId: remainingPlayerId });
            server.to(matchId).emit('match:youLost', { matchId, loserId: playerId });

            this.logger.debug(`Player ${playerId} did not return. Player ${remainingPlayerId} wins match ${matchId}`);
            this.activeMatches.delete(matchId);
        }, this.GAME_GRACE_MS);

        room.disconnectedPlayers.set(playerId, this.GAME_GRACE_MS);
        room.graceTimeouts.set(playerId, timeout);

        server.to(matchId).emit('player:disconnected', {
            playerId,
            graceMs: this.GAME_GRACE_MS,
        });
    }

    async handleMessage(client: Socket, matchId: string, playerId: number, message: string, server: Server) {
        this.logger.debug(`Player ${playerId} in ${matchId} says: ${message}`);
        server.to(matchId).emit('chat', { playerId, message });

        const room = this.activeMatches.get(matchId);
        if (
            message.trim().toUpperCase() === 'WIN' &&
            room &&
            !room.winner
        ) {
            room.winner = playerId;

            for (const pid of room.players) {
                const sockets = await this.getSocketIdsForPlayer(server, pid);
                const event = pid === playerId ? 'match:youWon' : 'match:youLost';

                for (const sid of sockets) {
                    server.to(sid).emit(event, { matchId, winnerId: playerId });
                }
            }

            this.activeMatches.delete(matchId);
        }
    }

    private async getSocketIdsForPlayer(server: Server, playerId: number): Promise<string[]> {
        const sockets = await server.fetchSockets();
        return sockets.filter(s => s.data.playerId === playerId).map(s => s.id);
    }
}
