import { inject, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SocketEvents } from '../constants/socket-events';

@Injectable({
  providedIn: 'root',
})
export class StatusSocketService {
  private socket: Socket | null = null;
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
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to status namespace');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from status namespace');
    });

    this.socket.on(SocketEvents.Friends.Listen.FriendsOnline, (data) => {
      console.log('Your online friends:', data);
      this.onlineFriendIds.set(data);
    });

    this.socket.on(SocketEvents.Friends.Listen.FriendOnline, (id: number) => {
      console.log(`Friend ${id} came online`);
      this.onlineFriendIds.update((friendIds) => [...friendIds, id]);
    });

    this.socket.on(SocketEvents.Friends.Listen.FriendOffline, (id: number) => {
      console.log(`Friend ${id} went offline`);
      this.onlineFriendIds.update((friendIds) =>
        friendIds.filter((i) => i !== id)
      );
    });
  }

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
}
