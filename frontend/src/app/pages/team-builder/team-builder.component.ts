import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Team } from '../../core/interfaces/team.model';
import { TeamsService } from '../../core/services/teams.service';
import { PokemonData } from '../../core/interfaces/pokemon.model';
import { TeamBuilderService } from '../../core/services/teamBuilder.service';

@Component({
  selector: 'team-builder',
  imports: [RouterModule],
  templateUrl: './team-builder.component.html',
  styleUrl: `team-builder.component.scss`,
})
export class TeamBuilderComponent {

  private teamService = inject(TeamsService);
  private teamBuilderService = inject(TeamBuilderService);

  playerTeams = signal<Team[]>([]);
  selectedTeam = signal<Team | null>(null);

  constructor() {
    this.loadTeams();
  }

  loadTeams() {
    this.teamService.getTeams().subscribe((response) => {
      const parsedTeams = response.data.map((team: any) => ({
        ...team,
        data: typeof team.data === 'string'
          ? JSON.parse(team.data) as PokemonData[]
          : team.data
      }));

      this.playerTeams.set(parsedTeams);
    });

  }

  getSpriteUrl(species: string): string {
    return this.teamBuilderService.getPokemonSprite(species);
  }

}
