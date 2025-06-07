import { Component, inject } from '@angular/core';
import { BattleService } from '../../core/services/battle.service';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.scss'],
})
export class BattleComponent {

  public battleService = inject(BattleService);
  constructor() {}

  // Señales para binding en template
  playerBattleStates = this.battleService['playerBattleStates'];
  enemyBattleStates = this.battleService['enemyBattleStates'];

  playerActive = () => this.battleService.getPlayerActive();
  enemyActive = () => this.battleService.getEnemyActive();

  doTurn(moveName: string) {
    this.battleService.doTurn(moveName);
  }

  switchTo(index: number) {
    this.battleService.playerSwitchTo(index);
  }
}
