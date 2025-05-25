import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Player } from '../../core/interfaces/player.model';
import { PlayerService } from '../../core/services/player.service';
import { TeamsService } from '../../core/services/teams.service';
import { TeamBuilderService } from '../../core/services/teamBuilder.service';
import { Team } from '../../core/interfaces/team.model';
import { PokemonData } from '../../core/interfaces/pokemon.model';

@Component({
  selector: 'profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  private playerService = inject(PlayerService);
  private teamsService = inject(TeamsService);
  private teamBuilderService = inject(TeamBuilderService);
  private route = inject(ActivatedRoute);

  playerProfile = signal<Player | null>(null);

  teams = signal<Team[]>([]);

  constructor() {
    const resolvedData = this.route.snapshot.data['profile'] as Player;
    this.playerProfile.set(resolvedData);

    this.teamsService.getTeams().subscribe((response: any) => {
      const parsedTeams: Team[] = response.data.map((team: any) => ({
        ...team,
        data: typeof team.data === 'string'
          ? JSON.parse(team.data) as PokemonData[]
          : team.data
      }));
      this.teams.set(parsedTeams);
    });
  }

  onImageError(event: Event) {
    this.playerService.setDefaultAvatar(event);
  }

  hasTeams(): boolean {
    return this.teams().length > 0;
  }

  getSpriteUrl(species: string): string {
    return this.teamBuilderService.getPokemonSprite(species);
  }
}
