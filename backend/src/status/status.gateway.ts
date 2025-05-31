import { Logger } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { MatchmakingService } from './matchmaking.service';
import { StatusService } from './status.service';
import { PlayerIdWs } from './decorators/player-ws.decorator';

@WebSocketGateway({
    namespace: 'status',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(StatusGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly statusService: StatusService,
        private readonly matchmakingService: MatchmakingService,
        private readonly authService: AuthService,
    ) { }

    /**
     * Handles a new WebSocket connection.
     * Authenticates the player, associates the socket, and registers them as online.
     */
    async handleConnection(client: Socket) {
        try {
            const player = await this.authService.authenticateClient(client);
            client.data.playerId = player.id;

            this.logger.debug(`Player ${player.id} connected with socket ${client.id}`);
            await this.statusService.handleNewConnection(client, player.id, this.server);
        } catch (err) {
            this.logger.warn(`Unauthorized socket connection: ${err.message}`);
            client.disconnect();
        }
    }

    /**
     * Handles a socket disconnection.
     * Updates player's status and notifies friends if the player goes offline.
     */
    async handleDisconnect(client: Socket) {
        const playerId = await this.statusService.handleDisconnection(client, this.server);
        if (!playerId) {
            this.logger.warn(`Player ID not found for socket ${client.id}. Something else disconnected?`);
            return;
        }

        this.logger.debug(`Player ${playerId} with socket id ${client.id} disconnected.`);
    }

    @SubscribeMessage('matchmaking:join')
    async onJoinMatchmaking(@PlayerIdWs() playerId: number) {
        await this.matchmakingService.joinMatchmaking(playerId, this.server);
    }

    @SubscribeMessage('matchmaking:leave')
    async onLeaveMatchmaking(@PlayerIdWs() playerId: number) {
        await this.matchmakingService.leaveMatchmaking(playerId);
    }

    @SubscribeMessage('battle:request')
    async onBattleRequest(@MessageBody() data: { to: number }, @PlayerIdWs() playerId: number) {
        await this.matchmakingService.sendBattleRequest(playerId, data.to, this.server);
    }

    @SubscribeMessage('battle:cancel')
    async onBattleCancel(@MessageBody() data: { to: number }, @PlayerIdWs() playerId: number) {
        await this.matchmakingService.cancelBattleRequest(playerId, data.to, this.server);
    }

    @SubscribeMessage('battle:accept')
    async onBattleAccept(
        @MessageBody() data: { from: number },
        @PlayerIdWs() playerId: number
    ) {
        await this.matchmakingService.acceptBattleRequest(data.from, playerId, this.server);
    }
}
