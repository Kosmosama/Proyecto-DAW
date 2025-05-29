import { Logger, UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { StatusService } from './status.service';
import { JwtWsGuard } from 'src/auth/guards/jwt-ws.guard';
import { PlayerPrivate } from 'src/player/interfaces/player-private.interface';
import { PlayerWs } from 'src/auth/decorators/player-ws.decorator';
import { MatchmakingService } from './matchmaking.service';

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
    // @UseGuards(JwtWsGuard)
    async handleConnection(
        client: Socket,
        //,
    ) {
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

        await this.matchmakingService.cleanupPlayerRequests(playerId);
        await this.matchmakingService.leaveMatchmaking(playerId);

        this.logger.debug(`Player ${playerId} with socket id ${client.id} disconnected.`);
    }

    @SubscribeMessage('matchmaking:join')
    async onJoinMatchmaking(client: Socket,) {
        const playerId = client.data.playerId;
        await this.matchmakingService.joinMatchmaking(playerId, this.server);
    }

    @SubscribeMessage('matchmaking:leave')
    async onLeaveMatchmaking(client: Socket,) {
        const playerId = client.data.playerId;
        await this.matchmakingService.leaveMatchmaking(playerId);
    }

    @SubscribeMessage('battle:request')
    async onBattleRequest(client: Socket, @MessageBody() data: { to: number }) {
        const playerId = client.data.playerId;
        await this.matchmakingService.sendBattleRequest(playerId, data.to, this.server);
    }

    @SubscribeMessage('battle:cancel')
    async onBattleCancel(client: Socket, @MessageBody() data: { to: number }) {
        const playerId = client.data.playerId;
        await this.matchmakingService.cancelBattleRequest(playerId, data.to, this.server);
    }

    @SubscribeMessage('battle:accept')
    async onBattleAccept(client: Socket, @MessageBody() data: { from: number }) {
        const playerId = client.data.playerId;
        await this.matchmakingService.acceptBattleRequest(data.from, playerId, this.server);
    }
}
