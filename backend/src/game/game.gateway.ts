import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private logger = new Logger('GameGateway');

    private matchmakingQueue: Socket[] = [];
    private playerSockets: Map<string, Socket> = new Map(); // userId => socket
    private pendingChallenges: Map<string, string> = new Map(); // challengerId => challengedId

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.playerSockets.set(userId, client);
            this.logger.log(`Client ${userId} connected as ${client.id}`);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.playerSockets.delete(userId);
            this.matchmakingQueue = this.matchmakingQueue.filter((sock) => sock !== client);
            this.logger.log(`Client ${userId} disconnected`);
        }
    }

    @SubscribeMessage('enterMatchmaking')
    handleEnterMatchmaking(@ConnectedSocket() client: Socket) {
        const opponent = this.matchmakingQueue.shift();

        if (opponent) {
            const roomName = `battle-${Date.now()}`;

            client.join(roomName);
            opponent.join(roomName);

            client.emit('matchFound', { opponentId: opponent.id, room: roomName });
            opponent.emit('matchFound', { opponentId: client.id, room: roomName });
        } else {
            this.matchmakingQueue.push(client);
            client.emit('waitingForMatch');
        }
    }


    @SubscribeMessage('challengeFriend')
    handleChallengeFriend(
        @MessageBody() data: { challengerId: string; friendId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const friendSocket = this.playerSockets.get(data.friendId);
        if (friendSocket) {
            this.pendingChallenges.set(data.challengerId, data.friendId);
            friendSocket.emit('challengeReceived', {
                from: data.challengerId,
            });
        } else {
            client.emit('error', { message: 'Friend is not online.' });
        }
    }

    @SubscribeMessage('acceptChallenge')
    handleAcceptChallenge(
        @MessageBody() data: { challengerId: string; friendId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const challengerSocket = this.playerSockets.get(data.challengerId);
        if (
            challengerSocket &&
            this.pendingChallenges.get(data.challengerId) === data.friendId
        ) {
            const roomName = `battle-${Date.now()}`;
            client.join(roomName);
            challengerSocket.join(roomName);

            challengerSocket.emit('challengeAccepted', {
                room: roomName,
                opponentId: data.friendId,
            });
            client.emit('challengeAccepted', {
                room: roomName,
                opponentId: data.challengerId,
            });

            this.pendingChallenges.delete(data.challengerId);
        } else {
            client.emit('error', { message: 'Invalid or expired challenge.' });
        }
    }
}
