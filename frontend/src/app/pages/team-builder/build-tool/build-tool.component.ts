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

  legalAbilities: string[][] = Array.from({ length: 6 }, () => []);
  legalMoves: string[][] = Array.from({ length: 6 }, () => []);

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

  MAX_TOTAL_EVS = 510;
  MAX_EV_PER_STAT = 252;


  teamName = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  pokemonForms: FormGroup<{
    name: FormControl<string>;
    item: FormControl<string>;
    ability: FormControl<string>;
    teraType: FormControl<string>;
    nature: FormControl<string>;
    evs: FormGroup<{
      hp: FormControl<number>;
      atk: FormControl<number>;
      def: FormControl<number>;
      spa: FormControl<number>;
      spd: FormControl<number>;
      spe: FormControl<number>;
    }>;
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
        nature: new FormControl('', { nonNullable: true }),
        evs: new FormGroup({
          hp: new FormControl(0, { nonNullable: true }),
          atk: new FormControl(0, { nonNullable: true }),
          def: new FormControl(0, { nonNullable: true }),
          spa: new FormControl(0, { nonNullable: true }),
          spd: new FormControl(0, { nonNullable: true }),
          spe: new FormControl(0, { nonNullable: true }),
        }),
        moves: new FormGroup({
          move1: new FormControl('', { nonNullable: true }),
          move2: new FormControl('', { nonNullable: true }),
          move3: new FormControl('', { nonNullable: true }),
          move4: new FormControl('', { nonNullable: true }),
        })
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
        nature: f.get('nature')?.value?.trim() ?? '',
        evs: f.get('evs')?.value,
        moves: {
          move1: f.get('moves.move1')?.value?.trim() ?? '',
          move2: f.get('moves.move2')?.value?.trim() ?? '',
          move3: f.get('moves.move3')?.value?.trim() ?? '',
          move4: f.get('moves.move4')?.value?.trim() ?? '',
        }
      }))
      .filter(p =>
        p.name && p.item && p.ability && p.teraType && p.nature && p.evs &&
        p.moves.move1 && p.moves.move2 && p.moves.move3 && p.moves.move4
      );

    if (rawTeam.length === 0) {
      console.warn('Debes completar al menos un Pokémon para guardar el equipo.');
      return;
    }

    //TODO fix this.teamsService.parseTeam
    const parsed = this.teamsService.parseTeam(rawTeam);
    this.teamsService.postTeam(teamName, parsed).subscribe(() => {
      console.log('Equipo guardado con éxito');
    });
  }



}
