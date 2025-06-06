import { Component, inject, signal } from '@angular/core';
import { MatchmakingService } from '../../../core/services/matchMaking.service';
import { TeamsService } from '../../../core/services/teams.service';
import { Team } from '../../../core/interfaces/team.model';
import { FormsModule } from '@angular/forms';
import { TeamBuilderService } from '../../../core/services/teamBuilder.service';
import { Router } from '@angular/router';

@Component({
  selector: 'matchmaking-panel',
  templateUrl: './matchmaking-panel.component.html',
  imports: [FormsModule],
  styleUrl: './matchmaking-panel.component.scss',
})
export class MatchmakingPanelComponent {

  isSearching = false;
  private matchmakingService = inject(MatchmakingService);
  private teamsService = inject(TeamsService);
  private teamBuilderService = inject(TeamBuilderService)
  private router = inject(Router);

  playerTeams = signal<Team[]>([]);
  selectedTeamId = signal<number | null>(null);
  selectedTeam = signal<Team | null>(null);

  constructor() {

    this.teamsService.getTeams().subscribe({
      next: (response) => {
        this.playerTeams.set(response.data);
        if (response.data.length > 0) {
          this.selectedTeamId.set(response.data[0].id!);
          this.updateSelectedTeam(response.data[0].id!);

        }
      },
      error: (error) => {
        console.error('Error fetching teams:', error);
      }
    });
    this.matchmakingService.onMatchFound(({ opponent }) => {
      console.log('Matched against', opponent);

      this.router.navigate(['pages/battle']);
    });

  }

  startSearch() {
    if (!this.selectedTeamId() || this.selectedTeamId() === null) {
      alert('Please, select a team before entering matchmaking');
      return;
    }
    this.isSearching = true;
    this.matchmakingService.joinMatchmaking(this.selectedTeamId()!);
  }

  stopSearch() {
    this.isSearching = false;
    this.matchmakingService.leaveMatchmaking();
  }

  updateSelectedTeam(teamId: number | string | null) {
    if (teamId === null) {
      this.selectedTeam.set(null);
      return;
    }

    const numericId = Number(teamId);
    const team = this.playerTeams().find(t => t.id === numericId) ?? null;
    this.selectedTeam.set(team);
  }


  getSpriteUrl(species: string): string {
    return this.teamBuilderService.getPokemonSprite(species);
  }

}
