import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Player } from '../../core/interfaces/player.model';
import { AuthService } from '../../core/services/auth.service';
import { PlayerService } from '../../core/services/player.service';
import { StatusSocketService } from '../../core/services/statusSocket.service';

@Component({
  selector: 'navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: 'navbar.component.scss'
})
export class NavbarComponent {

  private authService = inject(AuthService);
  private playerService = inject(PlayerService);
  private statusService = inject(StatusSocketService);

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

  onImageError(event: Event) {
    this.playerService.setDefaultAvatar(event);
  }

  logout() {
    this.statusService.disconnect();
    this.authService.logout()
  }
}
