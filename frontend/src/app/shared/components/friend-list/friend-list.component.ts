import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { Player, PlayersResponse } from '../../../core/interfaces/player.model';
import { PlayerService } from '../../../core/services/player.service';
import { RouterLink } from '@angular/router';
import { StatusSocketService } from '../../../core/services/statusSocket.service';

@Component({
  selector: 'app-friends-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
  imports: [CommonModule, RouterLink],
  standalone: true,
})
export class FriendListComponent implements OnInit {
  friends = signal<Player[]>([]);
  onlineFriends = signal<number[]>([]);

  title = input<string>('');
  showOnlyOnline = input<boolean>(false);

  loading = signal<boolean>(true);

  private playerService = inject(PlayerService);
  private statusSocket = inject(StatusSocketService);
  private currentPlayerId = signal<number | null>(null);

  constructor() {
    effect(() => {
      this.onlineFriends.set(this.statusSocket.getOnlineFriends());
    });
  }

  ngOnInit(): void {

    this.playerService.getProfile().subscribe({
      next: (player) => {
        this.currentPlayerId.set(player.id!);
        this.loadFriends();
      },
      error: () => {
        this.loadFriends();
      }
    });
  }

  loadFriends(): void {
    this.playerService.getFriends().subscribe({
      next: (data) => {
        const filtered = this.currentPlayerId
          ? data.filter(friend => friend.id !== this.currentPlayerId())
          : data;
        this.friends.set(filtered);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar los amigos:');
        this.loading.set(false);
      }
    });
  }

   get friendsWithStatus(): Player[] {
    const onlineIds = this.onlineFriends();
    let friendsList = [...this.friends()].map(friend => ({
      ...friend,
      online: onlineIds.includes(friend.id!),
    }));

    if (this.showOnlyOnline()) {
      friendsList = friendsList.filter(f => f.online);
    } else {
      friendsList.sort((a, b) => Number(b.online) - Number(a.online));
    }

    return friendsList;
  }

  onImageError(event: Event){
    this.playerService.setDefaultAvatar(event);
  }

}
