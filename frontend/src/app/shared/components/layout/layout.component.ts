import { Component, inject, input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from "../../../layouts/sidebar/sidebar.component";
import { BattleRequestComponent } from "../battle-request/battle-request.component";
import { FriendBattleCheckoutModalComponent } from "../modals/friend-battle-checkout-modal/friend-battle-checkout-modal.component";
import { Team } from '../../../core/interfaces/team.model';
import { MatchmakingService } from '../../../core/services/matchMaking.service';

@Component({
  selector: 'layout',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet, BattleRequestComponent, FriendBattleCheckoutModalComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  selectedOpponentId = signal<number | null>(null);
  showBattleModal = signal<boolean>(false);
  matchmakingService = inject(MatchmakingService);

  onAccept = input<number>();

  openBattleModal(opponentId: number) {
    this.selectedOpponentId.set(opponentId);
    this.showBattleModal.set(true);
  }

  onTeamConfirmed(teamId: number) {
    if (this.selectedOpponentId() !== null) {
      this.matchmakingService.acceptBattle(this.selectedOpponentId()!, teamId);
    }
    this.showBattleModal.set(false);
    this.selectedOpponentId.set(null);
  }

}
