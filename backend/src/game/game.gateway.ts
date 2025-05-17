import { WebSocketGateway, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GameService } from './game.service';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({ namespace: 'game' })
export class GameGateway{ // implements OnGatewayConnection, OnGatewayDisconnect 
    // private logger = new Logger('GameGateway');

    // constructor(
    //     private readonly gameService: GameService,
    //     private readonly authService: AuthService,
    // ) { }

    // /**
    //  * Handles a new client connection.
    //  * @param {Socket} client The socket client representing the connection.
    //  * @returns {Promise<void>} No return value.
    //  */
    // async handleConnection(client: Socket) {
    //     try {
    //         const token = this.authService.extractToken(client);
    //         const player = await this.authService.validateAccessToken(token);
    //         client.data.player = player;
    //         this.logger.log(`Client connected: ${player.username}#${player.tag}`);
    //     } catch (err) {
    //         this.logger.warn(`Unauthorized client tried to connect: ${client.id} ${err.message}`);
    //         client.disconnect();
    //     }
    // }

    // /**
    //  * Handles client disconnection.
    //  * @param {Socket} client The socket client representing the connection.
    //  * @returns {Promise<void>} No return value.
    //  */
    // async handleDisconnect(client: Socket) {
    //     await this.gameService.removeFromQueue(client);
    //     this.logger.log(`Client disconnected: ${client.id}`);
    // }

    // /**
    //  * Handles a request to join a matchmaking queue.
    //  * @param {Socket} client The socket client representing the connection.
    //  * @returns {Promise<void>} No return value.
    //  */
    // @SubscribeMessage('join-matchmaking')
    // async handleJoinMatchmaking(@ConnectedSocket() client: Socket) {
    //     const player = client.data.player;
    //     const room = await this.gameService.matchPlayer(client, player);
    //     if (room) {
    //         this.logger.log(`Match started in room: ${room}`);
    //     }
    // }

    // /**
    //  * Handles a request to leave the matchmaking queue.
    //  * @param {Socket} client The socket client representing the connection.
    //  * @returns {Promise<void>} No return value.
    //  */
    // @SubscribeMessage('leave-matchmaking')
    // async handleLeaveMatchmaking(@ConnectedSocket() client: Socket) {
    //     await this.gameService.removeFromQueue(client);
    // }

    // /**
    //  * Handles a request to challenge a friend.
    //  * @param {Socket} client The socket client representing the connection.
    //  * @param {number} targetId The ID of the target player.
    //  * @returns {Promise<void>} No return value.
    //  */
    // @SubscribeMessage('challenge-friend')
    // async handleChallengeFriend(
    //     @MessageBody() data: { targetId: number },
    //     @ConnectedSocket() client: Socket,
    // ) {
    //     const challenger = client.data.player;
    //     const room = await this.gameService.challengeFriend(client, data.targetId, challenger);
    //     if (room) {
    //         this.logger.log(`Challenge started in room: ${room}`);
    //     }
    // }

    // /**
    //  * Handles a request to join a room as a spectator.
    //  * @param {Socket} client The socket client representing the connection.
    //  * @param {string} room The room ID to join.
    //  * @returns {Promise<void>} No return value.
    //  */
    // @SubscribeMessage('join-as-spectator')
    // handleJoinAsSpectator(
    //     @MessageBody() data: { room: string },
    //     @ConnectedSocket() client: Socket,
    // ) {
    //     this.gameService.addSpectator(client, data.room);
    //     this.logger.log(`Spectator joined room: ${data.room}`);
    // }

    // /**
    //  * Handles a request to leave a room.
    //  * @param {Socket} client The socket client representing the connection.
    //  * @param {string} room The room ID to leave.
    //  * @returns {Promise<void>} No return value.
    //  */
    // // @SubscribeMessage('chat-message')
    // // handleChatMessage(
    // //     @MessageBody() data: { room: string; message: string },
    // //     @ConnectedSocket() client: Socket,
    // // ) {
    // //     #TODO Should this have auth too? So that I dont have to pass data.player
    // //     const player = client.data.player;
    // //     this.gameService.sendChatMessage(client, data.room, player.username, data.message);
    // // }

    // // #TODO Leave room when spectator/player
}
