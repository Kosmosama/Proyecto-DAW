import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class StatusSocketService {
    private socket: Socket | null = null;
    private socket2: Socket | null = null;
    private authService = inject(AuthService);
    private onlineFriendIds = signal<number[]>([]);

    constructor() {
        this.connect();
    }

    connect(): void {
        if (this.socket?.connected) return;


        this.socket = io(`${environment.apiUrl}/status`, {
            auth: {
                token: this.authService.getAccessToken(),
            }
        });

        this.socket2 = io(`${environment.apiUrl}/game`, {
            auth: {
                token: this.authService.getAccessToken(),
            }
        });

        this.socket.on('connect', () => {
            console.log('Connected to status namespace');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from status namespace');
        });

        this.socket.on('friends:online', (data) => {
            console.log('Your online friends:', data);
            this.onlineFriendIds.set(data);
        });

        this.socket.on('friend:online', (id: number) => {
            console.log(`Friend ${id} came online`);
            this.onlineFriendIds.update((friendIds: number[]) => [...friendIds, id]);
        });

        this.socket.on('friend:offline', (id) => {
            console.log(`Friend ${id} went offline`);
            this.onlineFriendIds.update((friendIds: number[]) =>
                friendIds.filter(i => i !== id)
            )
        });
    }

    // public listen<T = any>(event: string, callback: (data: T) => void): void {
    //     this.socket?.on(event, callback);
    // }

    getOnlineFriends(): number[] {
        return this.onlineFriendIds();
    }

    public disconnect(): void {
        if (this.socket) {
            console.log('Disconnecting from socket');
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // ngOnDestroy(): void {
    //     this.disconnect();
    // }
}
