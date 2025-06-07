import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Pokemon as CalcPokemon, Move as CalcMove, calculate, Generations } from '@smogon/calc';

import { Team } from '../../core/interfaces/team.model';
import { PokemonData } from '../../core/interfaces/pokemon.model';
import { TeamsService } from '../../core/services/teams.service';

const GENS = Generations.get(9);

@Component({
  selector: 'battle',
  standalone: true,
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.scss'],
})
export class BattleComponent {
  private teamService = inject(TeamsService);
  private route = inject(ActivatedRoute);

  playerTeam = signal<Team | null>(null);
  enemyTeam = signal<Team | null>(null);
  playerActive = signal<PokemonData | null>(null);
  enemyActive = signal<PokemonData | null>(null);
  battleLog = signal<string[]>([]);
  turn = signal(1);

  constructor() {
    this.loadTeamFromRoute();
  }

  loadTeamFromRoute() {
    this.route.queryParams.subscribe((params) => {
      const teamId = +params['number'];
      if (!teamId) return;

      this.teamService.getTeamById(teamId.toString()).subscribe((team) => {
        this.playerTeam.set(team);
        this.playerActive.set(team.data[0]);
      });

      const enemyDummy: PokemonData[] = [
        {
          species: 'Charizard',
          ability: 'Blaze',
          item: 'Leftovers',
          teraType: 'Fire',
          nature: 'Timid',
          moves: ['Flamethrower', 'Air Slash', 'Solar Beam', 'Dragon Pulse'],
          spriteUrl: 'https://img.pokemondb.net/sprites/home/normal/charizard.png'
        }
      ];

      this.enemyTeam.set({ name: 'Dummy', data: enemyDummy });
      this.enemyActive.set(enemyDummy[0]);
    });
  }

  doTurn(playerMoveName: string) {
    const player = this.playerActive();
    const enemy = this.enemyActive();
    if (!player || !enemy) return;

    const enemyMoveName = enemy.moves[Math.floor(Math.random() * enemy.moves.length)];

    const playerCalc = this.toCalcPokemon(player, playerMoveName);
    const enemyCalc = this.toCalcPokemon(enemy, enemyMoveName);

    const playerMove = new CalcMove(GENS, playerMoveName);
    const enemyMove = new CalcMove(GENS, enemyMoveName);

    const playerResult = calculate(GENS, playerCalc, enemyCalc, playerMove);
    const enemyResult = calculate(GENS, enemyCalc, playerCalc, enemyMove);

    const playerDamage = Array.isArray(playerResult.damage)
      ? playerResult.damage[0]
      : playerResult.damage;
    const enemyDamage = Array.isArray(enemyResult.damage)
      ? enemyResult.damage[0]
      : enemyResult.damage;

    this.battleLog.update((log) => [
      ...log,
      `Turno ${this.turn()}:`,
      `Tu ${player.species} usó ${playerMoveName} e hizo ${playerDamage} de daño.`,
      `El ${enemy.species} enemigo usó ${enemyMoveName} e hizo ${enemyDamage} de daño.`,
    ]);

    this.turn.set(this.turn() + 1);
  }

  private toCalcPokemon(data: PokemonData, moveName: string): CalcPokemon {
    return new CalcPokemon(GENS, data.species, {
      ability: data.ability,
      item: data.item,
      nature: data.nature,
      moves: [moveName],
    });
  }
}
