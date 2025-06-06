import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Team } from '../../core/interfaces/team.model';
import { TeamsService } from '../../core/services/teams.service';
import { PokemonData } from '../../core/interfaces/pokemon.model';
import { TeamBuilderService } from '../../core/services/teamBuilder.service';
import { BuildToolComponent } from "./build-tool/build-tool.component";

@Component({
  selector: 'team-builder',
  imports: [RouterModule, BuildToolComponent],
  templateUrl: './team-builder.component.html',
  styleUrl: `team-builder.component.scss`,
})
export class TeamBuilderComponent {

  private teamService = inject(TeamsService);
  private teamBuilderService = inject(TeamBuilderService);
  private router = inject(Router);

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

  editTeam(team: Team) {
  this.router.navigate(['/pages/team-builder/builder'], {
    queryParams: { id: team.id }
  });
}

  bounce(event: Event) {
    const target = event.target as HTMLElement;
    target.classList.add('bounce');

    const boCount = Math.floor(Math.random() * 5) + 1;
    const boString = 'bo'.repeat(boCount) + 'ing';
    console.log(boString);

    setTimeout(() => {
      target.classList.remove('bounce');
    }, 300);
  }
}
