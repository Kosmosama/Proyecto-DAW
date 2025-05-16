import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PokemonService } from '../../../core/services/pokemon.service';

@Component({
  selector: 'build-tool',
  imports: [ReactiveFormsModule],
  templateUrl: './build-tool.component.html',
  styles: ``
})
export class BuildToolComponent {

  private pokemonService = inject(PokemonService);

  team = signal<Array<string>>(["", "", "", "", "", ""]);
  speciesTest = signal<string>("");

  constructor() {
    this.speciesTest.set(this.pokemonService.getSpeciesJson());
    console.log(this.speciesTest());
  }

  pokemonForms: FormGroup<{ name: FormControl<string> }>[] = Array.from({ length: 6 }, () =>
    new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    })
  );

  visibleForms: boolean[] = Array(6).fill(false);

  toggleForm(index: number) {
    this.visibleForms[index] = !this.visibleForms[index];
  }

  isFormVisible(index: number): boolean {
    return this.visibleForms[index];
  }

  saveTeam() {
    const team = this.pokemonForms
      .map(f => (f.get('name')?.value ?? '').trim())
      .filter(Boolean);
    console.log('Equipo guardado:', team);
  }

}
