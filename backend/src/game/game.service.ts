import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { PlayerService } from 'src/player/player.service';
import { GameRoom } from './interfaces/game-room.interface';

@Injectable()
export class GameService {
    private matchmakingQueue: { socket: Socket; player: PlayerPrivate }[] = [];
    private gameRooms: Map<string, GameRoom> = new Map();

    constructor(private readonly playerService: PlayerService) { }

    matchPlayer(socket: Socket, player: PlayerPrivate): string | null {
        const opponentEntry = this.matchmakingQueue.shift();

        if (opponentEntry) {
            const { socket: opponentSocket, player: opponent } = opponentEntry;
            const roomId = `match-${player.id}-${opponent.id}-${Date.now()}`;
            socket.join(roomId);
            opponentSocket.join(roomId);

            this.gameRooms.set(roomId, {
                roomId,
                player1: opponentSocket,
                player2: socket,
                spectators: [],
            });

            socket.emit('matchFound', { roomId, opponent: opponent.username });
            opponentSocket.emit('matchFound', { roomId, opponent: player.username });
            return roomId;
        } else {
            this.matchmakingQueue.push({ socket, player });
            socket.emit('waitingForMatch');
            return null;
        }
    }


    async challengeFriend(socket: Socket, targetId: number, challenger: PlayerPrivate): Promise<string | null> {
        const targetPlayer = await this.playerService.findOnePrivate(targetId);
        if (!targetPlayer) {
            socket.emit('error', 'Friend not found');
            return null;
        }

        // #TODO
        // In real app, look up target socket via online user tracking (e.g., Redis or in-memory)
        // For now, just simulate:
        socket.emit('error', 'Challenging friend requires connection mapping');
        return null;
    }

    addSpectator(socket: Socket, roomId: string) {
        const room = this.gameRooms.get(roomId);
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        socket.join(roomId);
        room.spectators.push(socket);
        socket.emit('joinedAsSpectator', { roomId });
    }

    sendChatMessage(socket: Socket, roomId: string, username: string, message: string) {
        socket.to(roomId).emit('chatMessage', {
            from: username,
            message,
        });
    }

    removeFromQueue(socket: Socket) {
        const index = this.matchmakingQueue.findIndex((entry) => entry.socket.id === socket.id);
        if (index !== -1) {
            this.matchmakingQueue.splice(index, 1);
        }
    }
}
