import { Component, computed, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BattleService } from '../../core/services/battle.service';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
})
export class BattleComponent {
  private battleService = inject(BattleService);

  battleId = computed(() => this.battleService.battleId());

  constructor() {
    effect(() => {
      if (this.battleId()) {
        console.log('Comenzando batalla con ID:', this.battleId());

      }
    });
  }
}
