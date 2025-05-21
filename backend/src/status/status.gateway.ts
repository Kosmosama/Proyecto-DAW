import { Logger, UseGuards } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { StatusService } from './status.service';
import { JwtWsGuard } from 'src/auth/guards/jwt-ws.guard';

@UseGuards(JwtWsGuard)
@WebSocketGateway({ namespace: 'status' })
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(StatusGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly statusService: StatusService,
        private readonly authService: AuthService,
    ) { }

    /**
     * Handles a new WebSocket connection.
     * Authenticates the player, associates the socket, and registers them as online.
     */
    async handleConnection(client: Socket) {
        const player = client.data.player;
        this.logger.debug(`Player ${player.id} connected with socket ${client.id}`);
        await this.statusService.registerConnection(client, player.id, this.server);
    }

    /**
     * Handles a socket disconnection.
     * Updates player's status and notifies friends if the player goes offline.
     */
    async handleDisconnect(client: Socket) {
        const playerId = await this.statusService.handleDisconnection(client, this.server);
        if (playerId) {
            this.logger.debug(`Player ${playerId} fully disconnected.`);
        }
    }
}
