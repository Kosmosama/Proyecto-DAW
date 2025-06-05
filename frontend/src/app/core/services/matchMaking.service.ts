import { inject, Injectable, signal } from '@angular/core';
import { StatusSocketService } from './statusSocket.service';
import { BattleRequest } from '../interfaces/battle-request.model';
import { Team } from '../interfaces/team.model';

@Injectable({
  providedIn: 'root',
})
export class MatchmakingService {

  private statusSocket = inject(StatusSocketService);

  battleRequestReceived = signal<{ from: number } | null>(null);
  battleRequests = signal<BattleRequest[]>([]);
  error = signal<string | null>(null);

  constructor() {
    const socket = this.statusSocket['socket'];

    socket?.on('battle:request:received', (data: { from: number }) => {
      this.battleRequestReceived.set(data);
      this.error.set(null);
    });

    socket?.on('battle:request:cancelled', (data: { from: number }) => {
      this.battleRequestReceived.set(null);
      this.error.set(null);
    });

    const errorHandler = (data: any, eventName: string) => {
      if (data?.status === 'error') {
        const msg = data.message || 'Unknown error';
        const cause = data.cause ? JSON.stringify(data.cause) : 'No cause info';
        this.error.set(msg);
        console.error(`Socket error on event "${eventName}": ${msg}`, cause);
      } else {
        this.error.set(null);
      }
    };


    socket?.on('battle:request', (data) => errorHandler(data, 'battle:request'));
    socket?.on('battle:accept', (data) => errorHandler(data, 'battle:accept'));
    socket?.on('battle:cancel', (data) => errorHandler(data, 'battle:cancel'));
    socket?.on('matchmaking:join', (data) => errorHandler(data, 'matchmaking:join'));
    socket?.on('matchmaking:leave', (data) => errorHandler(data, 'matchmaking:leave'));

    socket?.on('match:found', () => this.error.set(null));
  }

  joinMatchmaking(teamId: number) {
    this.statusSocket['socket']?.emit('matchmaking:join', { teamId });
  }

  leaveMatchmaking() {
    this.statusSocket['socket']?.emit('matchmaking:leave');
  }

  onMatchFound(callback: (data: { opponent: number; mode: string; roomId: string }) => void) {
    this.statusSocket['socket']?.on('match:found', callback);
  }

  requestBattle(to: number, teamId: number) {
    this.statusSocket['socket']?.emit('battle:request', { to, teamId });
  }

  cancelBattle(to: number) {
    this.statusSocket['socket']?.emit('battle:cancel', { to });
  }

  acceptBattle(from: number, teamId: number) {
    this.statusSocket['socket']?.emit('battle:accept', { from, teamId });
  }
}
