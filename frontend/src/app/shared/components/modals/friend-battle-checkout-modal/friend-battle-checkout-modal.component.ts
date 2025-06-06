import { Component, inject, input, output, signal } from '@angular/core';
import { Team } from '../../../../core/interfaces/team.model';
import { TeamsService } from '../../../../core/services/teams.service';
import { TeamBuilderService } from '../../../../core/services/teamBuilder.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'friend-battle-checkout-modal',
  imports: [FormsModule, NgClass],
  templateUrl: './friend-battle-checkout-modal.component.html',
  styleUrl: './friend-battle-checkout-modal.component.scss',
})
export class FriendBattleCheckoutModalComponent {
  opponentId = input<number>();
  friendId = input<number>();
  show = input<boolean>(true);

  close = output<void>();
  confirmed = output<number>();

  playerTeams = signal<Team[]>([]);
  selectedTeam = signal<Team | null>(null);
  selectedTeamId = signal<number | null>(null);

  private teamsService = inject(TeamsService);
  private teamBuilderService = inject(TeamBuilderService);

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

  confirm() {
    if (this.selectedTeamId()) {
      this.confirmed.emit(this.selectedTeamId()!);
    }
  }

  cancel() {
    this.close.emit();
  }

  getSpriteUrl(species: string): string {
    return this.teamBuilderService.getPokemonSprite(species);
  }

  isSelected(team: Team): boolean {
    return this.selectedTeam()?.id === team.id;
  }

  selectTeam(team: Team) {
    this.selectedTeamId.set(team.id ?? null);
    this.selectedTeam.set(team);
  }
}
