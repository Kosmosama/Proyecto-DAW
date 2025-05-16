import { Component, inject, signal } from '@angular/core';
import { Player, PlayerResponse } from '../../core/interfaces/player.model';
import { PlayerService } from '../../core/services/player.service';

@Component({
  selector: 'profile',
  imports: [],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent {
  private playerService = inject(PlayerService);
  playerProfile = signal<Player | null>(null);

  constructor() {
    this.playerService.getProfile().subscribe({
      next: (response) => {
        this.playerProfile.set(response);
      },
      error: (error) => {
        console.error('Error fetching player profile:', error);
      },
    });
  }
}
