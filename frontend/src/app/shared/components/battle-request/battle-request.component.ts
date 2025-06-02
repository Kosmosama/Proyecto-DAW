import { Component, inject, signal, effect } from '@angular/core';
import { MatchmakingService } from '../../../core/services/matchMaking.service';

@Component({
  selector: 'battle-request',
  standalone: true,
  templateUrl: './battle-request.component.html',
  styleUrl: './battle-request.component.scss',
})
export class BattleRequestComponent {

  private matchmakingService = inject(MatchmakingService);

  currentRequest = signal<{ from: number } | null>(null);

  timeoutId?: ReturnType<typeof setTimeout>;
  progress = signal(100);
  intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      const req = this.matchmakingService.battleRequestReceived();
      if (req) {
        this.currentRequest.set(req);
        this.progress.set(100);

        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.intervalId) clearInterval(this.intervalId);

        const duration = 8000;
        const intervalMs = 100;
        const steps = duration / intervalMs;
        let stepCount = 0;

        this.intervalId = setInterval(() => {
          stepCount++;
          this.progress.set(100 - (stepCount / steps) * 100);
          if (stepCount >= steps) {
            clearInterval(this.intervalId);
          }
        }, intervalMs);

        this.timeoutId = setTimeout(() => {
          this.currentRequest.set(null);
          if (this.intervalId) clearInterval(this.intervalId);
          this.progress.set(100);
        }, duration);
      }
    });
  }

  acceptRequest() {
    if (this.currentRequest()) {
      this.matchmakingService.acceptBattle(this.currentRequest()!.from);
      this.clearRequest();
    }
  }

  rejectRequest() {
    if (this.currentRequest()) {
      this.matchmakingService.cancelBattle(this.currentRequest()!.from);
      this.clearRequest();
    }
  }

  private clearRequest() {
    this.currentRequest.set(null);
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.intervalId) clearInterval(this.intervalId);
    this.progress.set(100);
  }
}

