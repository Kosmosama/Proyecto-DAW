import { Component, inject, signal } from '@angular/core';
import { Player } from '../../core/interfaces/player.model';
import { StatusSocketService } from '../../core/services/statusSocket.service';
import { MatchmakingPanelComponent } from '../../shared/components/matchmaking-panel/matchmaking-panel.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'home',
  imports: [MatchmakingPanelComponent],
  templateUrl: './home.component.html',
  styleUrl: `home.component.scss`,
})
export class HomeComponent {

  player = signal<Player | null>(null);
  private socketService = inject(StatusSocketService);
  backgroundUrl = signal<string>('');

  constructor() {
    const images = [
      '/images/backgrounds/home_bg_1.jpg',
      '/images/backgrounds/home_bg_2.jpg',
      '/images/backgrounds/home_bg_3.jpg',
      '/images/backgrounds/home_bg_4.jpg',
    ];

    const randomIndex = Math.floor(Math.random() * images.length);
    this.backgroundUrl.set(`url('${images[randomIndex]}')`);
  }
}
