import { inject, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class GeneralChatSocketService {
  private socket: Socket | null = null;
  private authService = inject(AuthService);

  private messages = signal<{ playerId: number; message: string; timestamp: number }[]>([]);

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(`${environment.apiUrl}/status`, {
      auth: {
        token: this.authService.getAccessToken(),
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to general chat socket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from general chat socket');
    });

    // Escuchamos el evento broadcast con mensaje de chat general
    this.socket.on('general:message:broadcast', (data) => {
      this.messages.update((msgs) => [...msgs, data]);
    });
  }

  sendMessage(message: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.emit('general:message:unique', { message });
  }

  getMessages() {
    return this.messages.asReadonly();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
