import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class StatusSocketService implements OnDestroy {
    private socket: Socket | null = null;

    constructor() {
        this.connect();
    }

    private connect(): void {
        if (this.socket) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('No access token found');
            return;
        }

        this.socket = io(`${environment.apiUrl}/status`, {
            auth: { token },
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Connected to status namespace');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from status namespace');
        });

        this.socket.on('friends:online', (data) => {
            console.log('Your online friends:', data);
        });

        this.socket.on('friend:online', (id) => {
            console.log(`Friend ${id} came online`);
        });

        this.socket.on('friend:offline', (id) => {
            console.log(`Friend ${id} went offline`);
        });
    }

    public disconnect(): void {
        if (this.socket) {
            console.log('Disconnecting from socket');
            this.socket.disconnect();
            this.socket = null;
        }
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
