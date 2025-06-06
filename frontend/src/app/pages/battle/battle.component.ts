import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BattleService } from '../../core/services/battle.service';

@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './battle.component.html',
})
export class BattleComponent {
  private battleService = inject(BattleService);

  roomId = this.battleService.roomId;
  playerRole = this.battleService.playerRole;
  log = this.battleService.log;
  battleReady = this.battleService.battleReady;
  error = this.battleService.error;

  inputForm = new FormGroup({
    action: new FormControl('', Validators.required),
  });

  sendAction() {
    const input = this.inputForm.value.action;
    if (!input) return;

    this.battleService.choose(input);
    this.inputForm.reset();
  }
}
