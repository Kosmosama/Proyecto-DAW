import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../core/interfaces/player.interface';

@Component({
  standalone: true,
  selector: 'register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [ReactiveFormsModule]
})
export class RegisterComponent {
  loading = false;
  successMessage = '';
  errorMessage = '';
  private playerService = inject(PlayerService);
  private fb = inject(NonNullableFormBuilder);
  
  playerForm = this.fb.group({
    name: ['', [Validators.required]],
    passwordHash: ['', [Validators.required, Validators.minLength(6)]]
  });

  onRegister(): void {
    if (this.playerForm.invalid) {
      return;
    }

    this.loading = true;
    const playerData: Player = {
      name: this.playerForm.value.name!,
      passwordHash: this.playerForm.value.passwordHash!,
      photo: 'foto'
    };

    this.playerService.register(playerData).subscribe(
      (response) => {
        this.loading = false;
        this.successMessage = 'Jugador registrado con éxito';
        this.playerForm.reset();
      },
      (error) => {
        this.loading = false;
        this.errorMessage = 'Error al registrar al jugador';
      }
    );
  }
}
