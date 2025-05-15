import { Component, inject, signal } from '@angular/core';
import { PlayerResponse } from '../../core/interfaces/player.model';
import { PlayerService } from '../../core/services/player.service';

@Component({
  selector: 'profile',
  imports: [],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent {
  private playerService = inject(PlayerService);
  profile = signal<PlayerResponse | null>(null);

  constructor() {
    this.playerService.getProfile().subscribe({
      next: (response) => {
        this.profile.set(response);
        // console.log('Player profile:', this.playerProfile());
      },
      error: (error) => {
        console.error('Error fetching player profile:', error);
      },
    });
  }
}
