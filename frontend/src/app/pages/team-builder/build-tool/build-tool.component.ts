import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeamBuilderService } from '../../../core/services/teamBuilder.service';
import { pokemonNameValidator } from '../../../shared/validators/pokemon-builder.validator';
import { TeamsService } from '../../../core/services/teams.service';

@Component({
  selector: 'build-tool',
  imports: [ReactiveFormsModule],
  templateUrl: './build-tool.component.html',
  styles: ``
})
export class BuildToolComponent {

  private tbService = inject(TeamBuilderService);
  private teamsService = inject(TeamsService);

  team = signal<string[]>(Array(6).fill(''));

  speciesList = signal<string[]>([]);
  abilitiesList = signal<string[]>([]);
  itemsList = signal<string[]>([]);
  movesList = signal<string[]>([]);

  teraTypes = signal<string[]>([
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ]);

  natures = signal<string[]>([
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


  constructor() {
    this.speciesList.set(this.tbService.getSpecies());
    this.abilitiesList.set(this.tbService.getAbilities());
    this.itemsList.set(this.tbService.getItems());
    this.movesList.set(this.tbService.getMoves());

    this.pokemonForms = Array.from({ length: 6 }, (_, index) => {
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
          Spe: new FormControl(0, { nonNullable: true })
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
          this.legalAbilities[index] = data.abilities;
          this.legalMoves[index] = data.moves;
        } else {
          this.legalAbilities[index] = [];
          this.legalMoves[index] = [];
        }
      });

      return form;
    });
  }




  visibleForms: boolean[] = Array(6).fill(false);

  toggleForm(index: number) {
    this.visibleForms[index] = !this.visibleForms[index];
  }

  isFormVisible(index: number): boolean {
    return this.visibleForms[index];
  }

  saveTeam() {
    const teamName = this.teamName.value.trim();

    const rawTeam = this.pokemonForms
      .map(f => ({
        name: f.get('name')?.value?.trim() ?? '',
        item: f.get('item')?.value?.trim() ?? '',
        ability: f.get('ability')?.value?.trim() ?? '',
        teraType: f.get('teraType')?.value?.trim() ?? '',
        EVs: {
          HP: f.get('EVs.HP')?.value ?? 1,
          Atk: f.get('EVs.Atk')?.value ?? 0,
          Def: f.get('EVs.Def')?.value ?? 0,
          SpA: f.get('EVs.SpA')?.value ?? 0,
          SpD: f.get('EVs.SpD')?.value ?? 0,
          Spe: f.get('EVs.Spe')?.value ?? 0
        },
        nature: f.get('nature')?.value?.trim() ?? '',
        moves: {
          move1: f.get('moves.move1')?.value?.trim() ?? '',
          move2: f.get('moves.move2')?.value?.trim() ?? '',
          move3: f.get('moves.move3')?.value?.trim() ?? '',
          move4: f.get('moves.move4')?.value?.trim() ?? '',
        }
      }))
      .filter(p =>
        p.name && p.item && p.ability &&
        p.moves.move1 && p.moves.move2 && p.moves.move3 && p.moves.move4
      );

    if (rawTeam.length === 0) {
      console.warn('Debes completar al menos un Pokémon para guardar el equipo.');
      return;
    }

    const parsed = this.teamsService.parseTeam(rawTeam);
    this.teamsService.postTeam(teamName, parsed).subscribe(() => {
      console.log('Equipo guardado correctamente');
      this.teamName.reset();
      this.pokemonForms.forEach(form => form.reset());
      this.team.set(Array(6).fill(''));
    });
  }


}