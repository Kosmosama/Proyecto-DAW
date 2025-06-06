import { Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeamBuilderService } from '../../../core/services/teamBuilder.service';
import { pokemonNameValidator } from '../../../shared/validators/pokemon-builder.validator';
import { TeamsService } from '../../../core/services/teams.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../../../core/interfaces/team.model';

@Component({
  selector: 'build-tool',
  imports: [ReactiveFormsModule],
  templateUrl: './build-tool.component.html',
  styleUrls: ['./build-tool.component.scss'],
})
export class BuildToolComponent {

  private tbService = inject(TeamBuilderService);
  private teamsService = inject(TeamsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  teamToEdit = input<Team>();
  team = signal(Array(6).fill(0));

  speciesList = signal<string[]>(this.tbService.getSpecies());
  abilitiesList = signal<string[]>(this.tbService.getAbilities());
  itemsList = signal<string[]>(this.tbService.getItems());
  movesList = signal<string[]>(this.tbService.getMoves());

  teraTypes = signal([
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ]);

  natures = signal([
    'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
    'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
    'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
    'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
    'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
  ]);

  legalAbilities: string[][] = Array.from({ length: 6 }, () => []);
  legalMoves: string[][] = Array.from({ length: 6 }, () => []);

  teamName = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  pokemonForms: FormGroup<{
    name: FormControl<string>;
    item: FormControl<string>;
    ability: FormControl<string>;
    teraType: FormControl<string>;
    EVs: FormGroup<{
      HP: FormControl<number>;
      Atk: FormControl<number>;
      Def: FormControl<number>;
      SpA: FormControl<number>;
      SpD: FormControl<number>;
      Spe: FormControl<number>;
    }>;
    nature: FormControl<string>;
    moves: FormGroup<{
      move1: FormControl<string>;
      move2: FormControl<string>;
      move3: FormControl<string>;
      move4: FormControl<string>;
    }>;
  }>[] = [];

  pokemonSprites: string[] = [];
  visibleForms: boolean[] = Array(6).fill(false);

  constructor() {
    this.route.queryParams.subscribe(params => {
      const teamId = params['id'];
      if (teamId) this.loadTeamToEdit(teamId);
    });

    this.pokemonForms = Array.from({ length: 6 }, (_, i) => {
      const form = new FormGroup({
        name: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, pokemonNameValidator(this.speciesList())]
        }),
        item: new FormControl('', { nonNullable: true }),
        ability: new FormControl('', { nonNullable: true }),
        teraType: new FormControl('', { nonNullable: true }),
        EVs: new FormGroup({
          HP: new FormControl(1, { nonNullable: true }),
          Atk: new FormControl(0, { nonNullable: true }),
          Def: new FormControl(0, { nonNullable: true }),
          SpA: new FormControl(0, { nonNullable: true }),
          SpD: new FormControl(0, { nonNullable: true }),
          Spe: new FormControl(0, { nonNullable: true }),
        }),
        nature: new FormControl('', { nonNullable: true }),
        moves: new FormGroup({
          move1: new FormControl('', { nonNullable: true }),
          move2: new FormControl('', { nonNullable: true }),
          move3: new FormControl('', { nonNullable: true }),
          move4: new FormControl('', { nonNullable: true }),
        })
      });

      form.controls.name.valueChanges.subscribe(async (value) => {
        const species = this.speciesList().find(s => s.toLowerCase() === value.toLowerCase());
        if (species) {
          const data = await this.tbService.getSpeciesData(species);
          this.pokemonSprites[i] = this.tbService.getPokemonSprite(species);
          this.legalAbilities[i] = data.abilities;
          this.legalMoves[i] = data.moves;
        } else {
          this.pokemonSprites[i] = '';
          this.legalAbilities[i] = [];
          this.legalMoves[i] = [];
        }
      });

      return form;
    });
  }

  toggleForm(index: number) {
    this.visibleForms[index] = !this.visibleForms[index];
  }

  isFormVisible(index: number) {
    return this.visibleForms[index];
  }

  saveTeam() {
    const teamName = (this.teamName.value ?? '').trim();
    if (!teamName) return;

    const rawTeam = this.pokemonForms
      .map(f => ({
        name: (f.get('name')?.value ?? '').trim(),
        item: (f.get('item')?.value ?? '').trim(),
        ability: (f.get('ability')?.value ?? '').trim(),
        teraType: (f.get('teraType')?.value ?? '').trim(),
        EVs: {
          HP: f.get('EVs.HP')?.value ?? 1,
          Atk: f.get('EVs.Atk')?.value ?? 0,
          Def: f.get('EVs.Def')?.value ?? 0,
          SpA: f.get('EVs.SpA')?.value ?? 0,
          SpD: f.get('EVs.SpD')?.value ?? 0,
          Spe: f.get('EVs.Spe')?.value ?? 0,
        },
        nature: (f.get('nature')?.value ?? '').trim(),
        moves: {
          move1: (f.get('moves.move1')?.value ?? '').trim(),
          move2: (f.get('moves.move2')?.value ?? '').trim(),
          move3: (f.get('moves.move3')?.value ?? '').trim(),
          move4: (f.get('moves.move4')?.value ?? '').trim(),
        }
      }))
      .filter(p => p.name && p.item && p.ability && Object.values(p.moves).some(m => m));

    const parsed = this.teamsService.parseTeam(rawTeam);
    this.teamsService.postTeam(teamName, parsed).subscribe(() => {
      this.teamName.reset();
      this.pokemonForms.forEach(f => f.reset());
      this.pokemonSprites = [];
      this.router.navigate(['/team-builder']);
    });
  }

  async loadTeamToEdit(teamId: string) {
    const team = await this.teamsService.getTeamById(teamId).toPromise();
    if (team) {
      await this.setTeamToEdit(team);
    }
  }

  private async setTeamToEdit(team: Team) {
    this.teamName.setValue(team.name);

    for (let i = 0; i < team.data.length; i++) {
      const p = team.data[i];
      this.pokemonForms[i].patchValue({
        name: p.species,
        item: p.item,
        ability: p.ability,
        teraType: p.teraType,
        nature: p.nature,
        moves: {
          move1: p.moves[0] || '',
          move2: p.moves[1] || '',
          move3: p.moves[2] || '',
          move4: p.moves[3] || '',
        }
      });

      const data = await this.tbService.getSpeciesData(p.species);
      this.pokemonSprites[i] = this.tbService.getPokemonSprite(p.species);
      this.legalAbilities[i] = data.abilities;
      this.legalMoves[i] = data.moves;
    }
  }
}
