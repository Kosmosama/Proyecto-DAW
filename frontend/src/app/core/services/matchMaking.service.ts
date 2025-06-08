import { inject, Injectable, signal } from '@angular/core';
import { StatusSocketService } from './statusSocket.service';
import { BattleRequest } from '../interfaces/battle-request.model';
import { SocketEvents } from '../constants/socket-events';
import { TeamsService } from './teams.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MatchmakingService {

  private statusSocket = inject(StatusSocketService);
  private teamsService = inject(TeamsService);
  private router = inject(Router);

  battleRequestReceived = signal<{ from: number } | null>(null);
  battleRequests = signal<BattleRequest[]>([]);
  error = signal<string | null>(null);
  roomId = signal<string | null>(null);

  constructor() {
    const socket = this.statusSocket['socket'];

    socket?.on(SocketEvents.Battle.Listen.RequestReceived, (data: { from: number }) => {
      this.battleRequestReceived.set(data);
      this.error.set(null);
    });

    socket?.on(SocketEvents.Battle.Listen.RequestCancelled, () => {
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

    socket?.on(SocketEvents.Battle.Listen.RequestReceived, (data) => errorHandler(data, SocketEvents.Battle.Listen.RequestReceived));
    socket?.on(SocketEvents.Battle.Listen.RequestCancelled, (data) => errorHandler(data, SocketEvents.Battle.Listen.RequestCancelled));

    // socket?.on(SocketEvents.Matchmaking.Listen.BattleAccept, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.BattleAccept));
    // socket?.on(SocketEvents.Matchmaking.Listen.BattleCancel, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.BattleCancel));
    // socket?.on(SocketEvents.Matchmaking.Listen.Join, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.Join));
    // socket?.on(SocketEvents.Matchmaking.Listen.Leave, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.Leave));

    socket?.on(SocketEvents.Matchmaking.Listen.MatchFound, (data: { roomId?: string, opponent: number, mode: string }) => {
      this.error.set(null);
      if (data?.roomId) {
        this.roomId.set(data.roomId);
        localStorage.setItem('activeRoomId', data.roomId);
        console.log('Match found, room ID:', data.roomId);
        this.router.navigate(['pages/battle'])
      }
    });

  }

  joinMatchmaking(teamId: number) {
    this.statusSocket['socket']?.emit(SocketEvents.Matchmaking.Emit.Join, { teamId });
  }

  leaveMatchmaking() {
    this.statusSocket['socket']?.emit(SocketEvents.Matchmaking.Emit.Leave);
  }

  onMatchFound(callback: (data: { opponent: number; mode: string }) => void) {
    this.statusSocket['socket']?.on(SocketEvents.Matchmaking.Listen.MatchFound, callback);
  }

  requestBattle(to: number, teamId: number) {
    this.statusSocket['socket']?.emit(SocketEvents.Battle.Emit.Request, { to, teamId });
  }

  cancelBattle(to: number) {
    this.statusSocket['socket']?.emit(SocketEvents.Battle.Emit.Cancel, { to });
  }

  acceptBattle(from: number, teamId: number) {
    this.statusSocket['socket']?.emit(SocketEvents.Battle.Emit.Accept, { from, teamId });
  }

  getActiveRoomId(): string | null {
    return this.roomId() || localStorage.getItem('activeRoomId');
  }
}
