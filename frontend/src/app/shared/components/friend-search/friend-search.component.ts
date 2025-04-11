import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Player } from '../../../core/interfaces/player.interface';
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'app-friend-search',
  templateUrl: './friend-search.component.html',
  styleUrls: ['./friend-search.component.scss'],
  imports: [FormsModule],
  standalone: true,
})
export class FriendSearchComponent implements OnInit {
  allPlayers = signal<Player[]>([]);
  friends = signal<Player[]>([]);
  filteredPlayers = signal<Player[]>([]);
  searchTerm = '';
  private destroyRef = inject(DestroyRef);
  private playerService = inject(PlayerService)

  constructor(
  ) { }

  ngOnInit(): void {
    this.loadPlayers();
    this.loadFriends();
  }

  loadPlayers(): void {
    this.playerService.getPlayers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allPlayers.set(data);
          this.filterPlayers();
        },
        error: (error) => {
          console.error('Error al cargar los jugadores:', error);
        }
      });
  }

  loadFriends(): void {
    this.playerService.getFriends()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.friends.set(data);
          this.filterPlayers();
        },
        error: (error) => {
          console.error('Error al cargar los amigos:', error);
        }
      });
  }

  filterPlayers(): void {
    const filtered = this.allPlayers().filter(player =>
      !this.friends().some(friend => friend.id === player.id)
    );
    this.filteredPlayers.set(filtered);
  }

  applySearchFilter(): void {
    const nonFriendPlayers = this.allPlayers().filter(player =>
      !this.friends().some(friend => friend.id === player.id)
    );

    const term = this.searchTerm.toLowerCase().trim();

    if (term !== '') {
      const filtered = nonFriendPlayers.filter(player =>
        player.username.toLowerCase().includes(term)
      );
      this.filteredPlayers.set(filtered);
    } else {
      this.filteredPlayers.set(nonFriendPlayers);
    }
  }

  addFriend(player: Player): void {
    this.playerService.sendFriendRequest(player.id!)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          console.log("Request sent successfully to: ", player.username);
          this.loadFriends();
          this.loadPlayers();
        },
        error: (error) => {
          console.error('Error sending friend request:', error);
        }
      });
  }


  onSearchTermChange(): void {
    this.applySearchFilter();
  }
}
