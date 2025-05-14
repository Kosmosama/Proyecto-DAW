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
        if (this.socket) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('No se encontró token de acceso');
            return;
        }

        this.socket = io(`${environment.apiUrl}/status`, {
            query: {
                playerId,
                token,
            },
            transports: ['websocket'],
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
        console.log('Desconectando del socket');
        this.socket?.disconnect();
        this.socket = null;
    }
}