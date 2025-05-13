import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { StatusService } from './status.service';

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
        try {
            const token = this.authService.extractToken(client);
            const player = await this.authService.validateAccessToken(token);
            client.data.player = player;

            this.logger.debug(`Player ${player.id} connected with socket ${client.id}`);
            await this.statusService.registerConnection(client, player.id, this.server);
        } catch (err) {
            this.logger.warn(`Unauthorized connection: ${client.id} - ${err.message}`);
            client.disconnect();
        }
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
