import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { GameService } from './game.service';

@WebSocketGateway({
    namespace: 'game',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(GameGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly gameService: GameService,
        private readonly authService: AuthService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const player = await this.authService.authenticateClient(client);

            this.logger.debug(`Player ${player.id} connected with socket ${client.id}`);
            // await this.statusService.handleNewConnection(client, player.id, this.server);
        } catch (err) {
            this.logger.warn(`Unauthorized socket connection: ${err.message}`);
            client.disconnect();
        }
        
        // try {
        //     const player = await this.authService.authenticateClient(client);
        //     client.data.playerId = player.id;
        //     this.logger.debug(`Player ${player.id} connected to game gateway`);
        // } catch (err) {
        //     this.logger.warn(`Unauthorized connection: ${err.message}`);
        //     client.disconnect();
        // }
    }

    async handleDisconnect(client: Socket) {
        const playerId = client.data.playerId;
        this.logger.debug(`Player ${playerId} disconnected from game gateway`);
        await this.gameService.handlePlayerDisconnect(client, this.server);
    }

    @SubscribeMessage('joinMatch')
    async onJoinMatch(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string },
    ) {
        const { matchId } = data;
        const playerId = client.data.playerId;
        await this.gameService.joinMatch(client, matchId, playerId);
    }

    @SubscribeMessage('chat')
    async onChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string; message: string },
    ) {
        const playerId = client.data.playerId;
        await this.gameService.handleMessage(
            client,
            data.matchId,
            playerId,
            data.message,
            this.server,
        );
    }
}
