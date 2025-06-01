import { Server as SocketIOServer } from "socket.io";
import Redis from "ioredis";
import { PLAYER_SOCKETS_PREFIX } from "src/config/redis.constants";

/**
 * Emits an event to a specific player.
 * @param {Redis} redis The Redis client instance.
 * @param {Server} server The Socket.IO server instance.
 * @param {number} playerId The ID of the player.
 * @param {string} event The event name to emit.
 * @param {any} data The data to send with the event.
 * @returns {Promise<void>} No return value.
 */
export async function emitToPlayer(redis: Redis, server: SocketIOServer, playerId: number, event: string, data: any) {
    // Get all socket IDs associated with the player
    const sockets = await redis.smembers(`${PLAYER_SOCKETS_PREFIX}${playerId}`);

    // Emit the event to each socket in parallel
    await Promise.all(
        sockets.map(socketId => {
            server.to(socketId).emit(event, data);
            return Promise.resolve();
        })
    );
}