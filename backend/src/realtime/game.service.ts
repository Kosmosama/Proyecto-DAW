import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);

    async createGameRoom(player1Id: number, player2Id: number, server: Server) {
    }
}
