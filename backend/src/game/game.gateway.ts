import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private logger = new Logger('GameGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(
        @MessageBody() data: { room: string; username: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(data.room);
        client.to(data.room).emit('chatMessage', {
            from: 'System',
            message: `${data.username} joined the room.`,
        });
    }

    @SubscribeMessage('chatMessage')
    handleChatMessage(
        @MessageBody() data: { room: string; message: string; username: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.to(data.room).emit('chatMessage', {
            from: data.username,
            message: data.message,
        });
    }
}
