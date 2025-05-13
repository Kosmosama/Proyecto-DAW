import { WebSocketGateway, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GameService } from './game.service';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private logger = new Logger('GameGateway');

    constructor(
        private readonly gameService: GameService,
        private readonly authService: AuthService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = this.authService.extractToken(client);
            const player = await this.authService.validateAccessToken(token);
            client.data.player = player;
            this.logger.log(`Client connected: ${player.username}#${player.tag}`);
        } catch (err) {
            this.logger.warn(`Unauthorized client tried to connect: ${client.id} ${err.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const player = client.data?.player;
        this.gameService.removeFromQueue(client);
        if (player) {
            this.logger.log(`Client disconnected: ${player.username}#${player.tag}`);
        } else {
            this.logger.log(`Client disconnected: ${client.id}`);
        }
    }

    @SubscribeMessage('joinMatchmaking')
    async handleJoinMatchmaking(@ConnectedSocket() client: Socket) {
        const player = client.data.player;
        const room = this.gameService.matchPlayer(client, player);
        if (room) {
            this.logger.log(`Match started in room: ${room}`);
        }
    }

    @SubscribeMessage('challengeFriend')
    async handleChallengeFriend(
        @MessageBody() data: { targetId: number },
        @ConnectedSocket() client: Socket,
    ) {
        const challenger = client.data.player;
        const room = await this.gameService.challengeFriend(client, data.targetId, challenger);
        if (room) {
            this.logger.log(`Challenge started in room: ${room}`);
        }
    }

    @SubscribeMessage('joinAsSpectator')
    handleJoinAsSpectator(
        @MessageBody() data: { room: string },
        @ConnectedSocket() client: Socket,
    ) {
        this.gameService.addSpectator(client, data.room);
        this.logger.log(`Spectator joined room: ${data.room}`);
    }

    @SubscribeMessage('chatMessage')
    handleChatMessage(
        @MessageBody() data: { room: string; message: string },
        @ConnectedSocket() client: Socket,
    ) {
        const player = client.data.player;
        this.gameService.sendChatMessage(client, data.room, player.username, data.message);
    }
}
