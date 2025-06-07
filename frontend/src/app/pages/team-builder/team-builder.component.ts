import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PokemonData } from '../../core/interfaces/pokemon.model';
import { Team } from '../../core/interfaces/team.model';
import { PokemonService } from '../../core/services/pokemon.service';
import { TeamsService } from '../../core/services/teams.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../../shared/components/modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'team-builder',
  imports: [RouterModule],
  templateUrl: './team-builder.component.html',
  styleUrl: `team-builder.component.scss`,
})
export class TeamBuilderComponent {

  private teamService = inject(TeamsService);
  private pokemonService = inject(PokemonService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

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
    return this.pokemonService.getPokemonSprite(species);
  }

  editTeam(team: Team) {
    this.router.navigate(['/pages/team-builder/builder'], {
      queryParams: { id: team.id }
    });
  }

  deleteTeam(team: Team) {
    const modalRef = this.modalService.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Delete team';
    modalRef.componentInstance.body = `Are you sure you want to delete "${team.name}"?`;

    modalRef.result.then((confirmed) => {
      if (confirmed) {
        this.teamService.deleteTeam(team.id?.toString()!).subscribe(() => {
          this.loadTeams();
        });
      }
    }).catch(() => {
      console.log('Modal dismissed without confirmation');
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
