import { Component, inject, signal } from '@angular/core';
import { Player } from '../../core/interfaces/player.model';
import { StatusSocketService } from '../../core/services/statusSocket.service';
import { MatchmakingPanelComponent } from '../../shared/components/matchmaking-panel/matchmaking-panel.component';

@Component({
  selector: 'home',
  imports: [MatchmakingPanelComponent],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

  player = signal<Player | null>(null);
  private socketService = inject(StatusSocketService);
  constructor() {
  }
}
