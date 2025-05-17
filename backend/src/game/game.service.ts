import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { PlayerService } from 'src/player/player.service';
import { GameRoom } from './interfaces/game-room.interface';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { GAME_ROOMS_PREFIX, MATCHMAKING_QUEUE, PLAYER_FRIENDS_PREFIX, PLAYER_SOCKETS_PREFIX } from 'src/config/redis.constants';

@Injectable()
export class GameService {
    // constructor(
    //     private readonly playerService: PlayerService,
    //     @InjectRedis() private readonly redis: Redis
    // ) { }

    // async matchPlayer(socket: Socket, player: PlayerPrivate): Promise<string | null> {
    //     const opponentJson = await this.redis.lpop(MATCHMAKING_QUEUE);
    //     if (opponentJson) {
    //         const opponent = JSON.parse(opponentJson) as { id: number; socketId: string; username: string };

    //         const roomId = `match-${player.id}-${opponent.id}-${Date.now()}`;
    //         await this.saveGameRoom(roomId, socket.id, opponent.socketId);

    //         socket.join(roomId);
    //         const opponentSocket = await this.findSocket(opponent.socketId);
    //         opponentSocket?.join(roomId);

    //         socket.emit('match-found', { roomId, opponent: opponent.username });
    //         opponentSocket?.emit('match-found', { roomId, opponent: player.username });
    //         return roomId;
    //     }

    //     // Push self to queue
    //     await this.redis.rpush(MATCHMAKING_QUEUE, JSON.stringify({
    //         id: player.id,
    //         socketId: socket.id,
    //         username: player.username,
    //     }));

    //     socket.emit('waitingForMatch');
    //     return null;
    // }

    // async challengeFriend(socket: Socket, targetId: number, challenger: PlayerPrivate): Promise<string | null> {
    //     const isFriend = await this.areFriends(challenger.id, targetId);
    //     if (!isFriend) {
    //         socket.emit('error', 'Target user is not your friend');
    //         return null;
    //     }

    //     const targetSocketId = await this.getFirstSocketId(targetId);
    //     if (!targetSocketId) {
    //         socket.emit('error', 'Target user is not online');
    //         return null;
    //     }

    //     const roomId = `challenge-${challenger.id}-${targetId}-${Date.now()}`;
    //     await this.saveGameRoom(roomId, socket.id, targetSocketId);

    //     socket.join(roomId);
    //     const targetSocket = await this.findSocket(targetSocketId);
    //     targetSocket?.join(roomId);

    //     socket.emit('match-found', { roomId, opponentId: targetId });
    //     targetSocket?.emit('match-found', { roomId, opponentId: challenger.id });

    //     return roomId;
    // }

    // async removeFromQueue(socket: Socket) {
    //     const entries = await this.redis.lrange(MATCHMAKING_QUEUE, 0, -1);
    //     const updated = entries.filter((entry) => {
    //         const parsed = JSON.parse(entry);
    //         return parsed.socketId !== socket.id;
    //     });

    //     await this.redis.del(MATCHMAKING_QUEUE);
    //     if (updated.length > 0) {
    //         await this.redis.rpush(MATCHMAKING_QUEUE, ...updated);
    //     }
    // }

    // async addSpectator(socket: Socket, roomId: string) {
    //     const gameRoomRaw = await this.redis.hget(`${GAME_ROOMS_PREFIX}active`, roomId);
    //     if (!gameRoomRaw) {
    //         socket.emit('error', 'Room not found');
    //         return;
    //     }

    //     socket.join(roomId);
    //     socket.emit('joined-as-spectator', { roomId });
    // }

    // /**
    //  * Sends a chat message to a specific game room.
    //  * @param {Socket} socket The socket instance of the player sending the message.
    //  * @param {string} roomId The ID of the game room.
    //  * @param {string} username The username of the player sending the message.
    //  * @param {string} message The chat message content.
    //  */
    // // #TODO Change later for persistance (??)
    // sendChatMessage(socket: Socket, roomId: string, username: string, message: string) {
    //     socket.to(roomId).emit('chat-message', { from: username, message });
    // }

    // private async saveGameRoom(roomId: string, socketId1: string, socketId2: string) {
    //     const roomData = {
    //         roomId,
    //         player1: socketId1,
    //         player2: socketId2,
    //         spectators: [],
    //     };

    //     await this.redis.hset(`${GAME_ROOMS_PREFIX}active`, roomId, JSON.stringify(roomData));
    // }

    // private async getFirstSocketId(playerId: number): Promise<string | null> {
    //     const sockets = await this.redis.smembers(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
    //     return sockets[0] ?? null;
    // }

    // private async areFriends(playerId: number, targetId: number): Promise<boolean> {
    //     const redisKey = `${PLAYER_FRIENDS_PREFIX}${playerId}`;
    //     const isFriend = await this.redis.sismember(redisKey, targetId.toString());
    //     if (isFriend) return true;

    //     // Fallback to DB
    //     // #TODO Create function
    //     // return this.playerService.areFriends(playerId, targetId);
    //     return false; // Remove this line :D
    // }
}
