import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Player } from '../../../core/interfaces/player.model';
import { PlayerService } from '../../../core/services/player.service';
import { StatusSocketService } from '../../../core/services/statusSocket.service';
import { MatchmakingService } from '../../../core/services/matchMaking.service';
import { FriendBattleCheckoutModalComponent } from "../modals/friend-battle-checkout-modal/friend-battle-checkout-modal.component";
import { Team } from '../../../core/interfaces/team.model';

@Component({
  selector: 'app-friends-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
  imports: [CommonModule, RouterLink, FriendBattleCheckoutModalComponent],
  standalone: true,
})
export class FriendListComponent implements OnInit {

  private playerService = inject(PlayerService);
  private statusSocket = inject(StatusSocketService);
  private currentPlayerId = signal<number | null>(null);
  private matchmakingService = inject(MatchmakingService);

  friends = signal<Player[]>([]);
  onlineFriends = signal<number[]>([]);
  showBattleModal = signal(false);
  pendingBattleFriendId = signal<number | null>(null);



  title = input<string>('');
  showOnlyOnline = input<boolean>(false);

  loading = signal<boolean>(true);


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

  sendBattleRequest(friendId: number): void {
    this.pendingBattleFriendId.set(friendId);
    this.showBattleModal.set(true);
  }

  onTeamConfirmed(teamId: number): void {
    const friendId = this.pendingBattleFriendId();
    if (friendId != null) {
      this.matchmakingService.requestBattle(friendId, teamId);
    }
    this.resetBattleModal();
  }

  cancelBattleRequest(): void {
    this.resetBattleModal();
  }

  private resetBattleModal(): void {
    this.showBattleModal.set(false);
    this.pendingBattleFriendId.set(null);
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

  onImageError(event: Event) {
    this.playerService.setDefaultAvatar(event);
  }

}
