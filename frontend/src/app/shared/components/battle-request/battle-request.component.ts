import { Component, inject, signal, effect, output } from '@angular/core';
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

  onAccept = output<number>();

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
    const req = this.currentRequest();
    if (req) {
      this.onAccept.emit(req.from);
      this.clearRequest();
    }
  }

  rejectRequest() {
    const req = this.currentRequest();
    if (req) {
      this.matchmakingService.cancelBattle(req.from);
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

