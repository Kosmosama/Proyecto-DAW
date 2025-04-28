import { Logger } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlayerService } from 'src/player/player.service';

@WebSocketGateway({ namespace: 'status' })
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(StatusGateway.name);

    // In-memory "sets"
    private onlinePlayers: Set<number> = new Set(); // Set of player IDs
    private playerSockets: Map<number, Set<string>> = new Map(); // Map<playerId, Set<socketId>>
    private playerFriends: Map<number, number[]> = new Map(); // Map<playerId, friendIds[]>
    private socketToPlayer: Map<string, number> = new Map(); // Map<socketId, playerId>

    constructor(private readonly playerService: PlayerService) { }

    async handleConnection(client: Socket) {
        const playerId = this.extractPlayerId(client);
        if (!playerId) {
            client.disconnect();
            return;
        }

        this.logger.debug(`Player ${playerId} connected with socket ${client.id}`);
        this.socketToPlayer.set(client.id, playerId);

        const sockets = this.playerSockets.get(playerId) ?? new Set();
        sockets.add(client.id);
        this.playerSockets.set(playerId, sockets);

        if (!this.onlinePlayers.has(playerId)) {
            this.onlinePlayers.add(playerId);
            await this.notifyOnline(playerId);
        }
    }

    async handleDisconnect(client: Socket) {
        const playerId = this.socketToPlayer.get(client.id);
        if (!playerId) return;

        this.logger.debug(`Player ${playerId} disconnected socket ${client.id}`);
        this.playerService.updateLastLogin(playerId);
        this.socketToPlayer.delete(client.id);

        const sockets = this.playerSockets.get(playerId);
        if (!sockets) return;

        sockets.delete(client.id);
        if (sockets.size === 0) {
            this.playerSockets.delete(playerId);
            this.onlinePlayers.delete(playerId);
            await this.notifyOffline(playerId);
        } else {
            this.playerSockets.set(playerId, sockets);
        }
    }

    private async notifyOnline(playerId: number) {
        const friends = await this.playerService.getFriends(playerId);
        const friendIds = friends.map((f) => f.id);
        this.playerFriends.set(playerId, friendIds);

        const onlineFriends = friendIds.filter((id) => this.onlinePlayers.has(id));
        this.emitToPlayer(playerId, 'friends:online', onlineFriends);

        friendIds.forEach((friendId) => {
            if (this.onlinePlayers.has(friendId)) {
                this.emitToPlayer(friendId, 'friend:online', playerId);
            }
        });
    }

    private async notifyOffline(playerId: number) {
        const friendIds = this.playerFriends.get(playerId) ?? [];
        this.playerFriends.delete(playerId);

        friendIds.forEach((friendId) => {
            if (this.onlinePlayers.has(friendId)) {
                this.emitToPlayer(friendId, 'friend:offline', playerId);
            }
        });
    }

    private emitToPlayer(playerId: number, event: string, data: any) {
        const sockets = this.playerSockets.get(playerId);
        if (!sockets) return;

        for (const socketId of sockets) {
            this.server.to(socketId).emit(event, data);
        }
    }

    private extractPlayerId(client: Socket): number | null {
        const id = client.handshake.query?.playerId;
        return typeof id === 'string' ? parseInt(id, 10) : null;
    }
}
