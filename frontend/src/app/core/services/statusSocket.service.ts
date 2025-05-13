// core/services/status-socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class StatusSocketService {
    private socket: Socket | null = null;

    connect(playerId: number): void {
        if (this.socket) {
            return;
        }

        this.socket = io(`${environment.apiUrl}/status`, {
            query: { playerId },
            transports: ['websocket'], // <- fuerza el uso directo de WebSocket
        });


        this.socket.on('connect', () => {
            console.log('Conectado al namespace status');
        });

        this.socket.on('disconnect', () => {
            console.log('Desconectado de status');
        });

        this.socket.on('friends:online', (data) => {
            console.log('Tus amigos online:', data);
        });

        this.socket.on('friend:online', (id) => {
            console.log(`Tu amigo ${id} se conectó`);
        });

        this.socket.on('friend:offline', (id) => {
            console.log(`Tu amigo ${id} se desconectó`);
        });
    }

    disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }
}
