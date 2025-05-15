import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'build-tool',
  imports: [ReactiveFormsModule],
  providers: [],
  templateUrl: './build-tool.component.html',
  styles: ``
})
export class BuildToolComponent {

  team = signal<Array<string>>(["", "", "", "", "", ""]);

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
