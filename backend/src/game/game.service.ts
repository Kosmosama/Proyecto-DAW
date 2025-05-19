import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { PlayerService } from 'src/player/player.service';
import { GameRoom } from './interfaces/game-room.interface';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { GAME_ROOMS_PREFIX, MATCHMAKING_QUEUE, PLAYER_FRIENDS_PREFIX, PLAYER_SOCKETS_PREFIX } from 'src/config/redis.constants';
import { Server } from 'socket.io';

@Injectable()
export class GameService {
    constructor(
        private readonly playerService: PlayerService,
        @InjectRedis() private readonly redis: Redis
    ) { }

    async matchPlayer(server: Server, socket: Socket, player: PlayerPrivate): Promise<string | null> {
        const playerKey = `player:${player.id}`;
        const opponentKey = await this.redis.lpop(MATCHMAKING_QUEUE);

        if (opponentKey) {
            const opponentDataRaw = await this.redis.hget('matchmaking:players', opponentKey);
            if (!opponentDataRaw) {
                socket.emit('error', 'Opponent data not found');
                return null;
            }

            const opponentData = JSON.parse(opponentDataRaw) as { id: number; socketId: string; username: string };

            const [id1, id2] = [player.id, opponentData.id].sort();
            const roomId = `match-${id1}-${id2}-${Date.now()}`;

            await this.saveGameRoom(roomId, socket.id, opponentData.socketId);

            socket.join(roomId);
            const opponentSocket = await this.findSocket(server, opponentData.socketId);
            opponentSocket?.join(roomId);

            socket.emit('match-found', { roomId, opponent: opponentData.username });
            opponentSocket?.emit('match-found', { roomId, opponent: player.username });

            await this.redis.hdel('matchmaking:players', opponentKey); // Clean opponent metadata
            return roomId;
        }

        // No match found, push current player to queue
        await this.redis.rpush(MATCHMAKING_QUEUE, playerKey);
        await this.redis.hset('matchmaking:players', playerKey, JSON.stringify({
            id: player.id,
            socketId: socket.id,
            username: player.username,
        }));

        socket.emit('waiting-for-match');
        return null;
    }

    async challengeFriend(server: Server, socket: Socket, targetId: number, challenger: PlayerPrivate): Promise<string | null> {
        const isFriend = await this.areFriends(challenger.id, targetId);
        if (!isFriend) {
            socket.emit('error', 'Target user is not your friend');
            return null;
        }

        const targetSocketId = await this.getFirstSocketId(targetId);
        if (!targetSocketId) {
            socket.emit('error', 'Target user is not online');
            return null;
        }

        const roomId = `challenge-${challenger.id}-${targetId}-${Date.now()}`;
        await this.saveGameRoom(roomId, socket.id, targetSocketId);

        socket.join(roomId);
        const targetSocket = this.findSocket(server, targetSocketId);
        targetSocket?.join(roomId);

        socket.emit('match-found', { roomId, opponentId: targetId });
        targetSocket?.emit('match-found', { roomId, opponentId: challenger.id });

        return roomId;
    }

    async removeFromQueue(socket: Socket) {
        const playerKey = `player:${socket.data.player?.id}`;
        if (!playerKey) return;

        await this.redis.lrem(MATCHMAKING_QUEUE, 0, playerKey);
        await this.redis.hdel('matchmaking:players', playerKey);
    }

    async addSpectator(socket: Socket, roomId: string) {
        const gameRoom = await this.getRoom(roomId);
        if (!gameRoom) {
            socket.emit('error', 'Room not found');
            return;
        }

        // Prevent self-spectating
        const socketId = socket.id;
        if (socketId === gameRoom.player1 || socketId === gameRoom.player2) {
            socket.emit('error', 'You cannot spectate your own game');
            return;
        }

        // Check if the player is already a spectator
        if (gameRoom.spectators.includes(socketId)) {
            socket.emit('error', 'You are already a spectator in this room');
            return;
        }

        socket.join(roomId);
        socket.emit('joined-as-spectator', { roomId });
    }

    /**
     * Sends a chat message to a specific game room.
     * @param {Socket} socket The socket instance of the player sending the message.
     * @param {string} roomId The ID of the game room.
     * @param {string} username The username of the player sending the message.
     * @param {string} message The chat message content.
     */
    // #TODO Change later for persistance (??)
    sendChatMessage(socket: Socket, roomId: string, username: string, message: string) {
        socket.to(roomId).emit('chat-message', { from: username, message });
    }

    private findSocket(server: Server, socketId: string): Socket | null {
        return server.sockets.sockets.get(socketId) ?? null;
    }

    private async saveGameRoom(roomId: string, socketId1: string, socketId2: string) {
        const roomData: GameRoom = {
            roomId,
            player1: socketId1,
            player2: socketId2,
            spectators: [],
        };

        await this.redis.hset(`${GAME_ROOMS_PREFIX}active`, roomId, JSON.stringify(roomData));
    }

    private async getFirstSocketId(playerId: number): Promise<string | null> {
        const sockets = await this.redis.smembers(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
        return sockets[0] ?? null;
    }

    private async areFriends(playerId: number, targetId: number): Promise<boolean> {
        const redisKey = `${PLAYER_FRIENDS_PREFIX}${playerId}`;
        const isFriend = await this.redis.sismember(redisKey, targetId.toString());
        if (isFriend) return true;

        // Fallback to DB
        return this.playerService.areFriends(playerId, targetId);
    }

    private async getRoom(roomId: string): Promise<GameRoom | null> {
        const gameRoomRaw = await this.redis.hget(`${GAME_ROOMS_PREFIX}active`, roomId);
        if (!gameRoomRaw) return null;
        return JSON.parse(gameRoomRaw) as GameRoom;
    }
}
