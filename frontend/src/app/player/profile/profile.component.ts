import { Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Player } from '../../core/interfaces/player.model';
import { PokemonData } from '../../core/interfaces/pokemon.model';
import { Team } from '../../core/interfaces/team.model';
import { PlayerService } from '../../core/services/player.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { TeamsService } from '../../core/services/teams.service';
import { FriendListComponent } from '../../shared/components/friend-list/friend-list.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AvatarModalComponent } from '../../shared/components/modals/avatar-modal/avatar-modal.component';

@Component({
  selector: 'profile',
  standalone: true,
  imports: [ReactiveFormsModule, FriendListComponent],
  providers: [],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  private playerService = inject(PlayerService);
  private teamsService = inject(TeamsService);
  private pokemonService = inject(PokemonService);
  private fb = inject(NonNullableFormBuilder);
  private modalService = inject(NgbModal)

  playerProfile = signal<Player | null>(null);
  showEditForms = signal<boolean>(false);
  profile = input.required<Player>();
  teams = signal<Team[]>([]);

  editForm = this.fb.group({
    username: this.fb.control<string>(''),
    password: this.fb.control<string>(''),
  });

  constructor() {
    effect(() => {
      this.playerProfile.set(this.profile());
    })

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
    return this.pokemonService.getPokemonSprite(species);
  }

  toggleEditForms(): void {
    this.showEditForms.set(!this.showEditForms())
  }

  openAvatarModal() {
    const modalRef = this.modalService.open(AvatarModalComponent, {
      size: 'lg',
      backdrop: 'static',
    });

    modalRef.componentInstance.currentAvatar = this.playerProfile()!.photo;

    modalRef.result
      .then((newAvatar: string) => {
        if (newAvatar) {
          this.submitEditForm(newAvatar);
        }
      })
      .catch(() => { });
  }

  submitEditForm(avatar?: string): void {
    const raw = this.editForm.getRawValue();

    const newProfileData: { username?: string; password?: string, photo?: string } = {};
    if (raw.username && raw.username.trim()) newProfileData.username = raw.username.trim();
    if (raw.password && raw.password.trim()) newProfileData.password = raw.password.trim();
    if (avatar) newProfileData.photo = avatar;

    if (Object.keys(newProfileData).length === 0) {
      alert('No data given to update profile');
      return;
    }

    this.playerService.updatePlayerProfile(newProfileData).subscribe({
      next: (response) => {
        const updated = response.data;
        this.playerProfile.set({
          ...this.playerProfile()!,
          ...updated
        });

        this.showEditForms.set(false);
        this.editForm.reset();
      },
      error: () => {
        alert('There was an error updating your profile');
      }
    });
  }


}
