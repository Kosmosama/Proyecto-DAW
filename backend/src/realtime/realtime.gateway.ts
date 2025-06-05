import { Logger } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { SocketEvents } from 'src/common/constants/events.constants';
import { PlayerIdWs } from './decorators/player-ws.decorator';
import { BattleRequestCancelDto } from './dto/battle-request-cancel.dto';
import { BattleRequestDto } from './dto/battle-request.dto';
import { MatchmakingJoinDto } from './dto/matchmaking-join.dto';
import { MatchmakingService } from './matchmaking.service';
import { StatusService } from './status.service';
import { BattleService } from './battle.service';

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
        private readonly battleService: BattleService
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
     * @param {MatchmakingJoinDto} data - The data containing the team ID.
     * @param {number} playerId - The ID of the player joining the queue.
     */
    @SubscribeMessage(SocketEvents.Matchmaking.Listen.Join)
    async onJoinMatchmaking(
        client: Socket,
        @MessageBody() data: MatchmakingJoinDto,
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.joinMatchmaking(playerId, data.teamId, this.server);
        } catch (err) {
            client.emit(SocketEvents.Matchmaking.Listen.Join, { error: err.message });
        }
    }

    /**
     * Handles a request to leave the matchmaking queue.
     * @param {Socket} client - The socket client making the request.
     * @param {number} playerId - The ID of the player leaving the queue.
     */
    @SubscribeMessage(SocketEvents.Matchmaking.Listen.Leave)
    async onLeaveMatchmaking(
        client: Socket,
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.leaveMatchmaking(playerId);
        } catch (err) {
            client.emit(SocketEvents.Matchmaking.Listen.Leave, { error: err.message });
        }
    }

    /**
     * Handles a battle request from one player to another.
     * @param {Socket} client - The socket client making the request.
     * @param {BattleRequestDto} data - The data containing the target player ID and self team ID.
     * @param {number} playerId - The ID of the player sending the request.
     */
    @SubscribeMessage(SocketEvents.Battle.Listen.Request)
    async onBattleRequest(
        client: Socket,
        @MessageBody() data: BattleRequestDto,
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.sendBattleRequest(playerId, data.to, data.teamId, this.server);
        } catch (err) {
            client.emit(SocketEvents.Battle.Listen.Request, { error: err.message });
        }
    }

    /**
     * Handles a battle request acceptance.
     * @param {Socket} client - The socket client responding to the request.
     * @param {BattleRequestDto} data - The data containing the target player ID and self team ID.
     * @param {number} playerId - The ID of the player responding to the request.
     */
    @SubscribeMessage(SocketEvents.Battle.Listen.Accept)
    async onBattleAccept(
        client: Socket,
        @MessageBody() data: BattleRequestDto,
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.acceptBattleRequest(data.to, playerId, data.teamId, this.server);
        } catch (err) {
            client.emit(SocketEvents.Battle.Listen.Accept, { error: err.message });
        }
    }

    /**
     * Handles a battle request cancellation.
     * @param {Socket} client - The socket client responding to the request.
     * @param {BattleRequestCancelDto} data - The data containing the target player ID and self team ID.
     * @param {number} playerId - The ID of the player responding to the request.
     */
    @SubscribeMessage(SocketEvents.Battle.Listen.Cancel)
    async onBattleCancel(
        client: Socket,
        @MessageBody() data: BattleRequestCancelDto,
        @PlayerIdWs() playerId: number
    ) {
        try {
            await this.matchmakingService.cancelBattleRequest(playerId, data.from, this.server);
        } catch (err) {
            client.emit(SocketEvents.Battle.Listen.Cancel, { error: err.message });
        }
    }

    // Maybe do it
    // @SubscribeMessage('battle:requests:get')
    // async onGetBattleRequests(@PlayerIdWs() playerId: number) {
    //     const requests = await this.matchmakingService.getPendingBattleRequests(playerId);
    //     return requests;
    // }

    /**
     * Initializes a battle between two players.
     * @param {Socket} client - The socket client initiating the battle.
     * @param {Object} data - The data containing the opponent's player ID.
     * @param {number} playerId - The ID of the player initiating the battle.
     */

    @SubscribeMessage('battle:init')
    async onBattleInit(client: Socket, @MessageBody() data: { opponentId: number }, @PlayerIdWs() playerId: number) {

        const roomId = `battle-${playerId}-${data.opponentId}`;

        const battle = this.battleService.createBattle(roomId);

        battle.setPlayer('p1', { name: `Player ${playerId}` });
        battle.setPlayer('p2', { name: `Player ${data.opponentId}` });

        this.server.to(client.id).emit('battle:ready', { roomId, as: 'p1' });

        const sockets = await this.server.fetchSockets();
        const opponentSocket = sockets.find(s => s.data.playerId === data.opponentId);
        if (opponentSocket) {
            opponentSocket.emit('battle:ready', { roomId, as: 'p2' });
        }
    }

    /**
     * Handles a player's action in the battle (like move, switch, etc.).
     * @param {Socket} client - The socket client making the request.
     * @param {Object} data - The data containing the room ID, player role, and input command.
     * @param {number} playerId - The ID of the player making the action.
     */
    @SubscribeMessage('battle:choose')
    async onBattleChoose(client: Socket, @MessageBody() data: { roomId: string; as: 'p1' | 'p2'; input: string }, @PlayerIdWs() playerId: number) {
        try {
            const log = this.battleService.handleInput(data.roomId, data.as, data.input);

            const battle = this.battleService.getBattle(data.roomId);
            if (!battle) throw new Error('Battle not found');

            const sockets = await this.server.fetchSockets();
            for (const socket of sockets) {
                const pid = socket.data.playerId;
                if (data.roomId.includes(pid)) {
                    socket.emit('battle:log', { roomId: data.roomId, log });
                }
            }
        } catch (err) {
            client.emit('battle:error', { error: err.message });
        }
    }
}
