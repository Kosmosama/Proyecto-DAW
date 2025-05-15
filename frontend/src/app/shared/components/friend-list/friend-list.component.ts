import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Player, PlayersResponse } from '../../../core/interfaces/player.model';
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'app-friends-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class FriendListComponent implements OnInit {
  friends = signal<Player[]>([]);
  loading = signal<boolean>(true);
  private playerService = inject(PlayerService);

  constructor() { }

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends(): void {
    this.playerService.getFriends().subscribe({
      next: (data) => {
        this.friends.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar los amigos:', error);
        this.loading.set(false);
      }
    });
  }

}
