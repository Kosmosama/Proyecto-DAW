import { inject, Injectable, signal } from '@angular/core';
import { StatusSocketService } from './statusSocket.service';
import { BattleRequest } from '../interfaces/battle-request.model';
import { SocketEvents } from '../constants/socket-events';
import { TeamsService } from './teams.service';

@Injectable({
  providedIn: 'root',
})
export class MatchmakingService {

  private statusSocket = inject(StatusSocketService);
  private teamsService = inject(TeamsService);

  battleRequestReceived = signal<{ from: number } | null>(null);
  battleRequests = signal<BattleRequest[]>([]);
  error = signal<string | null>(null);

  constructor() {
    const socket = this.statusSocket['socket'];

    socket?.on(SocketEvents.Matchmaking.Listen.BattleRequestReceived, (data: { from: number }) => {
      this.battleRequestReceived.set(data);
      this.error.set(null);
    });

    socket?.on(SocketEvents.Matchmaking.Listen.BattleRequestCancelled, () => {
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

    socket?.on(SocketEvents.Matchmaking.Listen.BattleRequest, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.BattleRequest));
    socket?.on(SocketEvents.Matchmaking.Listen.BattleAccept, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.BattleAccept));
    socket?.on(SocketEvents.Matchmaking.Listen.BattleCancel, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.BattleCancel));
    socket?.on(SocketEvents.Matchmaking.Listen.Join, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.Join));
    socket?.on(SocketEvents.Matchmaking.Listen.Leave, (data) => errorHandler(data, SocketEvents.Matchmaking.Listen.Leave));

    socket?.on(SocketEvents.Matchmaking.Listen.MatchFound, () => this.error.set(null));
  }

  joinMatchmaking(teamId: number) {
    this.statusSocket['socket']?.emit(SocketEvents.Matchmaking.Emit.Join, { teamId });
  }

  leaveMatchmaking() {
    this.statusSocket['socket']?.emit(SocketEvents.Matchmaking.Emit.Leave);
  }

  onMatchFound(callback: (data: { opponent: number; mode: string }) => void) {
    this.statusSocket['socket']?.on(SocketEvents.Matchmaking.Emit.MatchFound, callback);
  }

  requestBattle(to: number, teamId: number) {
    this.statusSocket['socket']?.emit(SocketEvents.Matchmaking.Emit.BattleRequest, { to, teamId });
  }

  cancelBattle(to: number) {
    this.statusSocket['socket']?.emit(SocketEvents.Matchmaking.Emit.BattleCancel, { to });
  }

  acceptBattle(from: number, teamId: number) {
    this.statusSocket['socket']?.emit(SocketEvents.Matchmaking.Emit.BattleAccept, { from, teamId });

    this.teamsService.getTeamById(teamId.toString()).subscribe(team => {
      this.statusSocket['socket']?.emit('battle:create', {
        opponentId: from,
        team: JSON.stringify(this.teamsService.parseTeam(team.data))
      });
    });
  }

}
