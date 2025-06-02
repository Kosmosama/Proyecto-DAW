import { inject, Injectable, signal } from '@angular/core';
import { StatusSocketService } from './statusSocket.service';
import { BattleRequest } from '../interfaces/battle-request.model';

@Injectable({
  providedIn: 'root',
})
export class MatchmakingService {

  private statusSocket = inject(StatusSocketService);
  battleRequestReceived = signal<{ from: number } | null>(null);
  battleRequests = signal<BattleRequest[]>([]);

  constructor() {
    const socket = this.statusSocket['socket'];

    socket?.on('battle:request:received', (data: { from: number }) => {
      this.battleRequestReceived.set(data);
    });

    socket?.on('battle:request:cancelled', (data: { from: number }) => {
    });
  }

  joinMatchmaking(teamId: number) {
    this.statusSocket['socket']?.emit('matchmaking:join', { teamId });
  }

  leaveMatchmaking() {
    this.statusSocket['socket']?.emit('matchmaking:leave');
  }

  onMatchFound(callback: (data: { opponent: number; mode: string }) => void) {
    this.statusSocket['socket']?.on('match:found', callback);
  }

  requestBattle(to: number) {
    this.statusSocket['socket']?.emit('battle:request', { to });
  }

  cancelBattle(to: number) {
    this.statusSocket['socket']?.emit('battle:cancel', { to });
  }

  acceptBattle(from: number) {
    this.statusSocket['socket']?.emit('battle:accept', { from });
  }

}
