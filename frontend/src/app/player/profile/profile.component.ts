import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Player } from '../../core/interfaces/player.model';
import { PlayerService } from '../../core/services/player.service';

@Component({
  selector: 'profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent {

  private playerService = inject(PlayerService);
  private route = inject(ActivatedRoute);

  playerProfile = signal<Player | null>(null);

  constructor() {
    const resolvedData = this.route.snapshot.data['profile'] as Player;
    this.playerProfile.set(resolvedData);
  }

  onImageError(event: Event) {
    this.playerService.setDefaultAvatar(event);
  }
}
