import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { SocketEvents } from 'src/common/constants/events.constants';
import { PlayerIdWs } from './decorators/player-ws.decorator';
import { BattleRequestAcceptDto } from './dto/battle-request-accept.dto';
import { BattleRequestCancelDto } from './dto/battle-request-cancel.dto';
import { BattleRequestDto } from './dto/battle-request.dto';
import { GameActionDto } from './dto/game-action.dto';
import { GameChatDto } from './dto/game-chat.dto';
import { MatchmakingJoinDto } from './dto/matchmaking-join.dto';
import { GameService } from './game.service';
import { MatchmakingService } from './matchmaking.service';
import { StatusService } from './status.service';
import { GeneralChatDto } from './dto/general-chat.dto';

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
        private readonly authService: AuthService,
        private readonly statusService: StatusService,
        private readonly matchmakingService: MatchmakingService,
        private readonly gameService: GameService,
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
        @ConnectedSocket() client: Socket,
        @MessageBody() data: MatchmakingJoinDto,
        @PlayerIdWs() playerId: number
    ) {
        if (!data?.teamId || isNaN(Number(data.teamId))) {
            client.emit(SocketEvents.Matchmaking.Listen.Join, { error: 'Invalid or missing team ID' });
            return;
        }

        try {
            await this.matchmakingService.joinMatchmaking(playerId, Number(data.teamId), this.server);
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
        @ConnectedSocket() client: Socket,
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
        @ConnectedSocket() client: Socket,
        @MessageBody() data: BattleRequestDto,
        @PlayerIdWs() playerId: number
    ) {
        if (!data?.teamId || isNaN(Number(data.teamId)) || !data.to || isNaN(Number(data.to))) {
            client.emit(SocketEvents.Battle.Listen.Request, { error: 'Invalid team or target player ID' });
            return;
        }

        try {
            await this.matchmakingService.sendBattleRequest(playerId, data.to, data.teamId, this.server);
        } catch (err) {
            client.emit(SocketEvents.Battle.Listen.Request, { error: err.message });
        }
    }

    /**
     * Handles a battle request acceptance.
     * @param {Socket} client - The socket client responding to the request.
     * @param {BattleRequestAcceptDto} data - The data containing the target player ID and self team ID.
     * @param {number} playerId - The ID of the player responding to the request.
     */
    @SubscribeMessage(SocketEvents.Battle.Listen.Accept)
    async onBattleAccept(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: BattleRequestAcceptDto,
        @PlayerIdWs() playerId: number
    ) {
        if (!data?.teamId || isNaN(Number(data.teamId)) || !data.from || isNaN(Number(data.from))) {
            client.emit(SocketEvents.Battle.Listen.Accept, { error: 'Invalid request. Team ID and player ID required.' });
            return;
        }

        try {
            await this.matchmakingService.acceptBattleRequest(data.from, playerId, data.teamId, this.server);
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
        @ConnectedSocket() client: Socket,
        @MessageBody() data: BattleRequestCancelDto,
        @PlayerIdWs() playerId: number
    ) {
        if (!data?.from || isNaN(Number(data.from))) {
            client.emit(SocketEvents.Battle.Listen.Cancel, { error: 'Invalid or missing sender ID' });
            return;
        }

        try {
            await this.matchmakingService.cancelBattleRequest(playerId, data.from, this.server);
        } catch (err) {
            client.emit(SocketEvents.Battle.Listen.Cancel, { error: err.message });
        }
    }

    /**
     * Handles a player's action during a game.
     * @param {Socket} client - The socket client making the request.
     * @param {GameActionDto} data - The data containing the room ID and action.
     * @param {number} playerId - The ID of the player performing the action.
     */
    @SubscribeMessage(SocketEvents.Game.Listen.Action)
    async onPlayerAction(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: GameActionDto,
        @PlayerIdWs() playerId: number
    ) {
        if (!data?.roomId || typeof data.roomId !== 'string') {
            client.emit(SocketEvents.Game.Listen.Action, { error: 'Invalid or missing room ID' });
            return;
        }

        const validTypes = ['switch', 'move', 'forfeit'];
        if (!data?.action || !validTypes.includes(data.action.type)) {
            client.emit(SocketEvents.Game.Listen.Action, { error: 'Invalid or missing action type' });
            return;
        }

        if (data.action.type === 'switch' && (typeof data.action.pokeIndex !== 'number' || isNaN(data.action.pokeIndex))) {
            client.emit(SocketEvents.Game.Listen.Action, { error: 'Invalid or missing pokeIndex for switch action' });
            return;
        }

        if (data.action.type === 'move' && (typeof data.action.moveIndex !== 'number' || isNaN(data.action.moveIndex))) {
            client.emit(SocketEvents.Game.Listen.Action, { error: 'Invalid or missing moveIndex for move action' });
            return;
        }

        try {
            await this.gameService.handlePlayerAction(playerId, data.roomId, data.action, this.server);
        } catch (err) {
            client.emit(SocketEvents.Game.Listen.Action, { error: err.message });
        }
    }

    /**
     * Handles a player's chat message during a game.
     * @param {Socket} client - The socket client making the request.
     * @param {GameChatDto} data - The data containing the room ID and message.
     * @param {number} playerId - The ID of the player sending the message.
     */
    @SubscribeMessage(SocketEvents.Game.Listen.Chat)
    async onGameRoomChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: GameChatDto,
        @PlayerIdWs() playerId: number
    ) {
        if (!data?.roomId || typeof data.roomId !== 'string') {
            client.emit(SocketEvents.Game.Listen.Chat, { error: 'Invalid or missing room ID' });
            return;
        }

        if (!data?.message || typeof data.message !== 'string' || !data.message.trim()) {
            client.emit(SocketEvents.Game.Listen.Chat, { error: 'Invalid message content' });
            return;
        }

        try {
            await this.gameService.handleGameRoomChat(data.roomId, playerId, data.message, this.server);
        } catch (err) {
            client.emit(SocketEvents.Game.Listen.Chat, { error: err.message });
        }
    }

    /**
     * Handles a general chat message from a player.
     * @param {Socket} client - The socket client making the request.
     * @param {GeneralChatDto} data - The data containing the message.
     * @param {number} playerId - The ID of the player sending the message.
     */
    @SubscribeMessage(SocketEvents.GeneralChat.Listen.MessageUnique)
    async onGeneralChatMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: GeneralChatDto,
        @PlayerIdWs() playerId: number
    ) {
        if (!data?.message || typeof data.message !== 'string' || !data.message.trim()) {
            client.emit(SocketEvents.GeneralChat.Listen.MessageUnique, { error: 'Invalid message content' });
            return;
        }

        const payload = {
            playerId,
            message: data.message,
            timestamp: Date.now(),
        };

        // Broadcast to all connected sockets
        this.server.emit(SocketEvents.GeneralChat.Emit.MessageBroadcast, payload);
    }
}