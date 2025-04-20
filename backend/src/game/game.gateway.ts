import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    async handleConnection(client: Socket) {
        console.log('handleConnection', client.handshake.query);
    }

    async handleDisconnect(client: Socket) {
        console.log('handleDisconnect', client.handshake.query);

    }
}
