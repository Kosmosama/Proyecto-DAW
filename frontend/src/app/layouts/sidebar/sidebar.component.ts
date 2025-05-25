import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PlayerService } from '../../core/services/player.service';
import { StatusSocketService } from '../../core/services/statusSocket.service';
import { Player } from '../../core/interfaces/player.model';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {

  private authService = inject(AuthService);
  private playerService = inject(PlayerService);
  private statusService = inject(StatusSocketService);

  isSidebarVisible = signal<boolean>(true);
  playerProfile = signal<Player | null>(null);

  sidebarItems = [
    { label: 'Home', link: 'pages/home', icon: 'bi bi-house-door' },
    { label: 'Friends', link: 'player/friends', icon: 'bi bi-controller' },
    { label: 'Team Builder', link: 'pages/team-builder', icon: 'bi bi-person-plus' },
  ];

  ngOnInit(): void {
    this.playerService.getProfile().subscribe({
      next: (response) => this.playerProfile.set(response),
      error: (err) => console.error('Error loading profile:', err)
    });
  }

  toggleSidebar(): void {
    this.isSidebarVisible.set(!this.isSidebarVisible);
  }

  onImageError(event: Event) {
    this.playerService.setDefaultAvatar(event);
  }

  logout() {
    this.statusService.disconnect();
    this.authService.logout();
  }
}
