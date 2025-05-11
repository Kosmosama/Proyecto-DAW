import { Component, DestroyRef, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Player, PlayersResponse } from '../../../core/interfaces/player.model';
import { PlayerService } from '../../../core/services/player.service';
import { from } from 'rxjs';

@Component({
  selector: 'app-friend-search',
  templateUrl: './friend-search.component.html',
  styleUrls: ['./friend-search.component.scss'],
  imports: [FormsModule],
  standalone: true,
})
export class FriendSearchComponent implements OnInit {
  incomingRequests = input.required<Player[]>();
  outgoingRequests = input.required<Player[]>();
  allPlayers = signal<Player[]>([]);
  friends = signal<PlayersResponse>({ data: [], meta: { more: false } });
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  totalPlayers = signal<number>(0);
  pageSize = 9;
  visiblePlayers = signal<Player[]>([]);

  private destroyRef = inject(DestroyRef);
  private playerService = inject(PlayerService);

  searchTerm$ = computed(() => this.searchTerm());

  constructor() {
    effect(() => {
      from(this.searchTerm$()).pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.loadPlayers();
      });
    });
  }

  ngOnInit(): void {
    this.loadFriends();
  }

  loadPlayers(): void {
    console.log('a')
    this.playerService.getPlayer().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (currentPlayer) => {
        const excludeIds = [
          currentPlayer.id,
          ...this.friends().data.map(f => f.id),
          ...this.incomingRequests().map(r => r.id),
          ...this.outgoingRequests().map(r => r.id)
        ].filter((id): id is number => typeof id === 'number');

        const page = this.currentPage();
        const search = this.searchTerm().trim();

        console.log('b');
        this.playerService.getPlayers({ page, search, excludeIds })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data) => {
              this.allPlayers.set(data);
              this.totalPlayers.set(data.length);
              this.updateVisiblePlayers();
            },
            error: (error) => {
              console.error('Error al cargar los jugadores:', error);
            }
          });
      },
      error: (err) => {
        console.error('Error al obtener el jugador actual:', err);
      }
    });
  }

  loadFriends(): void {
    this.playerService.getFriends()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.friends.set(data);
        },
        error: (error) => {
          console.error('Error al cargar los amigos:', error);
        }
      });
  }

  addFriend(player: Player): void {
    this.playerService.sendFriendRequest(player.id!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log("Solicitud enviada con éxito a: ", player.username);
          this.loadFriends();
          this.loadPlayers();
        },
        error: (error) => {
          console.error('Error al enviar solicitud de amistad:', error);
        }
      });
  }

  updateVisiblePlayers(): void {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize - 1;
    const visible = this.allPlayers().slice(startIndex, endIndex + 1);
    this.visiblePlayers.set(visible);
  }

  changePage(page: number): void {
    if (page < 1 || page > Math.ceil(this.totalPlayers() / this.pageSize)) return;
    this.currentPage.set(page);
    this.updateVisiblePlayers();
  }
}
