import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);

    // #TODO Change to redis later, this is just for testing :D
    private activeMatches: Map<string, Set<number>> = new Map();
    private winners: Set<string> = new Set();

    async joinMatch(client: Socket, matchId: string, playerId: number) {
        client.join(matchId);
        this.logger.debug(`Player ${playerId} joined match ${matchId}`);

        if (!this.activeMatches.has(matchId)) {
            this.activeMatches.set(matchId, new Set());
        }

        this.activeMatches.get(matchId)?.add(playerId);
    }

    async handleMessage(
        client: Socket,
        matchId: string,
        playerId: number,
        message: string,
        server: Server,
    ) {
        this.logger.debug(`Player ${playerId} in ${matchId} says: ${message}`);

        server.to(matchId).emit('chat', {
            playerId,
            message,
        });

        if (
            message.trim().toUpperCase() === 'WIN' &&
            !this.winners.has(matchId)
        ) {
            this.winners.add(matchId);
            this.logger.log(`Player ${playerId} wins match ${matchId}`);

            const playerIds = this.activeMatches.get(matchId) ?? new Set();

            const winnerSocketIds = await this.getSocketIdsForPlayer(server, playerId);
            for (const socketId of winnerSocketIds) {
                server.to(socketId).emit('match:youWon', {
                    matchId,
                });
            }

            for (const otherPlayerId of playerIds) {
                if (otherPlayerId === playerId) continue;
                const socketIds = await this.getSocketIdsForPlayer(server, otherPlayerId);
                for (const socketId of socketIds) {
                    server.to(socketId).emit('match:youLost', {
                        matchId,
                        winnerId: playerId,
                    });
                }
            }

            this.activeMatches.delete(matchId);
        }
    }

    private async getSocketIdsForPlayer(server: Server, playerId: number): Promise<string[]> {
        const sockets = Array.from(await server.fetchSockets());
        return sockets
            .filter(socket => socket.data.playerId === playerId)
            .map(socket => socket.id);
    }
}
