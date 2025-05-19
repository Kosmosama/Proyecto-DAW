import { Socket } from "socket.io";

export interface GameRoom {
    roomId: string;
    player1: string;
    player2: string;
    spectators: string[];
}