import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { JwtWsGuard } from "src/auth/guards/jwt-ws-auth.guard";
import { SocketWithUser } from "./interfaces/socket-with-user.interface";
import { PlayerWs } from "src/player/decorators/player-ws.decorator";
import { PlayerPublic } from "src/player/interfaces/player-public.interface";
import { Server } from "socket.io";
import { StatusService } from "./status.service";


@WebSocketGateway({
    cors: {
        origin: '*', // adjust as needed
    },
})
@UseGuards(JwtWsGuard)
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly statusService: StatusService
    ) { }

    async handleConnection(client: SocketWithUser) {
        const player = client.user;
        await this.statusService.setOnline(player.id, client.id);
        this.server.emit('status:update', {
            playerId: player.id,
            status: 'online',
        });
    }

    async handleDisconnect(client: SocketWithUser) {
        const player = client.user;
        const stillOnline = await this.statusService.setOffline(player.id, client.id);

        if (!stillOnline) {
            this.server.emit('status:update', {
                playerId: player.id,
                status: 'offline',
            });
        }
    }

    @SubscribeMessage('status:whois')
    async handleStatusRequest(
        @MessageBody() playerIds: string[],
        @ConnectedSocket() client: SocketWithUser,
    ) {
        const result = await this.statusService.getStatusBulk(playerIds);
        client.emit('status:bulk', result);
    }

    @SubscribeMessage('status:me')
    async handleMe(@PlayerWs() player: PlayerPublic, @ConnectedSocket() client: SocketWithUser) {
        client.emit('status:me', {
            playerId: player.id,
            status: await this.statusService.getStatus(player.id),
        });
    }
}
