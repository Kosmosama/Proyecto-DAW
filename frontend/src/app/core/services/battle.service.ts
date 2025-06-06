import { inject, Injectable, signal } from '@angular/core';
import { StatusSocketService } from './statusSocket.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  private socket = inject(StatusSocketService)['socket'];

  roomId = signal<string | null>(null);
  playerRole = signal<'p1' | 'p2' | null>(null);
  log = signal<string[]>([]);
  battleReady = signal(false);
  error = signal<string | null>(null);

  constructor() {
    const statusSocket = inject(StatusSocketService);
    const router = inject(Router);

    const socket = statusSocket['socket'];

    socket?.on('battle:ready', (data: { roomId: string, as: 'p1' | 'p2' }) => {
      this.roomId.set(data.roomId);
      this.playerRole.set(data.as);
      console.log('Battle ready! Joining room', data.roomId);
      router.navigate(['pages/battle', data.roomId]);
    });
  }

  private registerEvents() {
    this.socket?.on('battle:ready', ({ roomId, as }) => {
      this.roomId.set(roomId);
      this.playerRole.set(as);
      this.battleReady.set(true);
      this.error.set(null);
    });

    this.socket?.on('battle:log', ({ roomId, log }) => {
      if (roomId === this.roomId()) {
        this.log.set(log);
      }
    });

    this.socket?.on('battle:error', ({ error }) => {
      this.error.set(error);
      console.error('Battle error:', error);
    });
  }

  choose(input: string) {
    const roomId = this.roomId();
    const as = this.playerRole();

    if (!roomId || !as) return;

    this.socket?.emit('battle:choose', { roomId, as, input });
  }

  reset() {
    this.roomId.set(null);
    this.playerRole.set(null);
    this.battleReady.set(false);
    this.log.set([]);
    this.error.set(null);
  }
}
