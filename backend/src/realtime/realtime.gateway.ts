import { Logger } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { PlayerIdWs } from './decorators/player-ws.decorator';
import { MatchmakingService } from './matchmaking.service';
import { StatusService } from './status.service';

@WebSocketGateway({
    namespace: 'status',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(RealtimeGateway.name);

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

    /**
     * Handles a request to join the matchmaking queue.
     * @param {Socket} client - The socket client making the request.
     * @param {Object} data - The data containing the team ID.
     * @param {number} playerId - The ID of the player joining the queue.
     */
    @SubscribeMessage('matchmaking:join')
    async onJoinMatchmaking(
        client: Socket,
        @MessageBody() data: { teamId: number },
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.joinMatchmaking(playerId, data.teamId, this.server);
        } catch (err) {
            client.emit('matchmaking:join', { error: err.message });
        }
    }

    /**
     * Handles a request to leave the matchmaking queue.
     * @param {Socket} client - The socket client making the request.
     * @param {number} playerId - The ID of the player leaving the queue.
     */
    @SubscribeMessage('matchmaking:leave')
    async onLeaveMatchmaking(
        client: Socket,
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.leaveMatchmaking(playerId);
        } catch (err) {
            client.emit('matchmaking:leave', { error: err.message });
        }
    }

    /**
     * Handles a battle request from one player to another.
     * @param {Socket} client - The socket client making the request.
     * @param {Object} data - The data containing the target player ID and self team ID.
     * @param {number} playerId - The ID of the player sending the request.
     */
    @SubscribeMessage('battle:request')
    async onBattleRequest(
        client: Socket,
        @MessageBody() data: { to: number; teamId: number },
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.sendBattleRequest(playerId, data.to, data.teamId, this.server);
        } catch (err) {
            client.emit('battle:request', { error: err.message });
        }
    }

    /**
     * Handles a battle request acceptance.
     * @param {Socket} client - The socket client responding to the request.
     * @param {Object} data - The data containing the target player ID and self team ID.
     * @param {number} playerId - The ID of the player responding to the request.
     */
    @SubscribeMessage('battle:accept')
    async onBattleAccept(
        client: Socket,
        @MessageBody() data: { to: number; teamId: number },
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.acceptBattleRequest(data.to, playerId, data.teamId, this.server);
        } catch (err) {
            client.emit('battle:accept', { error: err.message });
        }
    }

    /**
     * Handles a battle request cancellation.
     * @param {Socket} client - The socket client responding to the request.
     * @param {} data - The data containing the target player ID and self team ID.
     * @param {number} playerId - The ID of the player responding to the request.
     */
    @SubscribeMessage('battle:cancel')
    async onBattleCancel(
        client: Socket,
        @MessageBody() data: { from: number },
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.cancelBattleRequest(playerId, data.from, this.server);
        } catch (err) {
            client.emit('battle:cancel', { error: err.message });
        }
    }

    // Maybe do it
    // @SubscribeMessage('battle:requests:get')
    // async onGetBattleRequests(@PlayerIdWs() playerId: number) {
    //     const requests = await this.matchmakingService.getPendingBattleRequests(playerId);
    //     return requests;
    // }
}
