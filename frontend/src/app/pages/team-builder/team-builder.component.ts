import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Team } from '../../core/interfaces/team.model';
import { TeamsService } from '../../core/services/teams.service';

@Component({
  selector: 'team-builder',
  imports: [RouterModule],
  templateUrl: './team-builder.component.html',
  styleUrl: `team-builder.component.scss`,
})
export class TeamBuilderComponent {

  private teamService = inject(TeamsService);

  playerTeams = signal<Team[]>([]);
  selectedTeam = signal<Team | null>(null);

  constructor() {

  }


  loadTeams() {
    this.teamService.getTeams().subscribe((response) => {
      this.playerTeams.set(response.data);
      console.log('Player Teams:', this.playerTeams());
    });

  }

}
