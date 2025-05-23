import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Player } from '../../core/interfaces/player.model';

@Component({
  selector: 'profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent {
  private route = inject(ActivatedRoute);
  playerProfile = signal<Player | null>(null);

  constructor() {
    const resolvedData = this.route.snapshot.data['profile'] as Player;
    this.playerProfile.set(resolvedData);
  }
}
