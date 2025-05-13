import { Component, inject, signal } from '@angular/core';
import { PlayerResponse } from '../../core/interfaces/player.model';
import { AuthService } from '../../core/services/auth.service';
import { PlayerService } from '../../core/services/player.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'navbar',
  imports: [],
  providers: [RouterLink],
  templateUrl: './navbar.component.html',
  styles: ``
})
export class NavbarComponent {

  private authService = inject(AuthService);
  private playerService = inject(PlayerService);
  // private loginComponent = inject(LoginComponent);

  playerProfile = signal<PlayerResponse | null>(null);

  constructor() {
    this.playerService.getProfile().subscribe({
      next: (response) => {
        this.playerProfile.set(response);
        console.log('Player profile:', this.playerProfile());
      },
      error: (error) => {
        console.error('Error fetching player profile:', error);
      },
    });
  }

  logout() {
    this.authService.logout()
  }
}
