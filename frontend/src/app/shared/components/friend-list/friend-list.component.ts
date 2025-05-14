import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { PlayerService } from '../../../core/services/player.service';
import { Player, PlayersResponse } from '../../../core/interfaces/player.model';
import { CommonModule } from '@angular/common';
import { StatusSocketService } from '../../../core/services/statusSocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-friends-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class FriendListComponent implements OnInit, OnDestroy {
  friends = signal<PlayersResponse>({ data: [], meta: { more: false } });
  loading = signal<boolean>(true);
  private playerService = inject(PlayerService);
  private statusSocketService = inject(StatusSocketService);

  private friendOnlineSubscription: Subscription | null = null;
  private friendOfflineSubscription: Subscription | null = null;

  constructor() { }

  ngOnInit(): void {
    this.loadFriends();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.cleanupSocketListeners();
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

  setupSocketListeners(): void {
    this.friendOnlineSubscription = this.statusSocketService.friendOnline$.subscribe(id => {
      if (id) {
        const updatedFriends = this.friends().data.map(friend => {
          if (friend.id === id) {
            friend.online = true;
          }
          return friend;
        });
        this.friends.set({ data: updatedFriends, meta: this.friends().meta });
      }
    });

    // Cuando un amigo se desconecta
    this.friendOfflineSubscription = this.statusSocketService.friendOffline$.subscribe(id => {
      if (id) {
        const updatedFriends = this.friends().data.map(friend => {
          if (friend.id === id) {
            friend.online = false;
          }
          return friend;
        });
        this.friends.set({ data: updatedFriends, meta: this.friends().meta });
      }
    });
  }

  cleanupSocketListeners(): void {
    this.friendOnlineSubscription?.unsubscribe();
    this.friendOfflineSubscription?.unsubscribe();
  }
}
