import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Player } from '../../core/interfaces/player.model';
import { PlayerService } from '../../core/services/player.service';
import { TeamsService } from '../../core/services/teams.service';
import { TeamBuilderService } from '../../core/services/teamBuilder.service';
import { Team } from '../../core/interfaces/team.model';
import { PokemonData } from '../../core/interfaces/pokemon.model';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FriendListComponent } from '../../shared/components/friend-list/friend-list.component';

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
  private teamBuilderService = inject(TeamBuilderService);
  private route = inject(ActivatedRoute);
  private fb = inject(NonNullableFormBuilder);

  playerProfile = signal<Player | null>(null);
  showEditForms = signal<boolean>(false);

  teams = signal<Team[]>([]);

  editForm = this.fb.group({
    username: this.fb.control<string>(''),
    password: this.fb.control<string>(''),
  });

  constructor() {
    const resolvedData = this.route.snapshot.data['profile'] as Player;
    effect(() => {

      this.playerProfile.set(resolvedData);
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
    return this.teamBuilderService.getPokemonSprite(species);
  }

  toggleEditForms(): void {
    this.showEditForms.set(!this.showEditForms())
  }

  submitEditForm() {
    const raw = this.editForm.getRawValue();

    const newProfileData: { username?: string; password?: string } = {};
    if (raw.username && raw.username.trim()) newProfileData.username = raw.username.trim();
    if (raw.password && raw.password.trim()) newProfileData.password = raw.password.trim();

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

        alert('Profile successfully updated');
        this.showEditForms.set(false);
        this.editForm.reset();
      },
      error: () => {
        alert('There was an error updating your profile');
      }
    });
  }


}
