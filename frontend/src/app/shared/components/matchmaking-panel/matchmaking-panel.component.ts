import { Component, inject } from '@angular/core';
import { MatchmakingService } from '../../../core/services/matchMaking.service';

@Component({
  selector: 'matchmaking-panel',
  templateUrl: './matchmaking-panel.component.html',
})
export class MatchmakingPanelComponent {

  isSearching = false;
  private matchmakingService = inject(MatchmakingService);

  constructor() {
    this.matchmakingService.onMatchFound((data) => {
      this.isSearching = false;
      console.log('Match found!', data);
    });
  }

  startSearch() {
    this.isSearching = true;
    this.matchmakingService.joinMatchmaking();
  }

  stopSearch() {
    this.isSearching = false;
    this.matchmakingService.leaveMatchmaking();
  }
}
