import { Socket } from "socket.io";

export interface GameRoom {
    roomId: string;
    player1: Socket;
    player2: Socket;
    spectators: Socket[];
}