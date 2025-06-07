import { inject, Injectable, signal } from '@angular/core';
import { PokemonData } from '../interfaces/pokemon.model';
import { Team } from '../interfaces/team.model';
import { PokemonService } from './pokemon.service';
import { Pokemon as CalcPokemon, Move as CalcMove, calculate, Generations } from '@smogon/calc';

const GENS = Generations.get(9);

interface PokemonBattleState {
  pokemon: PokemonData;
  currentHP: number;
  maxHP: number;
  fainted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  private pokemonService = inject(PokemonService);

  // Equipos y estado de batalla
  private playerTeam = signal<Team | null>(null);
  private enemyTeam = signal<Team | null>(null);

  // Estado de cada Pokémon en batalla (incluyendo HP actual)
  private playerBattleStates = signal<PokemonBattleState[]>([]);
  private enemyBattleStates = signal<PokemonBattleState[]>([]);

  // Pokémon activos actuales
  private playerActiveIndex = signal(0);
  private enemyActiveIndex = signal(0);

  // Logs y control
  battleLog = signal<string[]>([]);
  turn = signal(1);
  isBattleOver = signal(false);
  winner = signal<'player' | 'enemy' | null>(null);

  constructor(pokemonService: PokemonService) {
    this.pokemonService = pokemonService;
  }

  getPlayerActiveIndex(): number {
    return this.playerActiveIndex();
  }

  getEnemyActiveIndex(): number {
    return this.enemyActiveIndex();
  }


  // Inicializar equipos y estados
  setTeams(player: Team, enemy: Team) {
    this.playerTeam.set(player);
    this.enemyTeam.set(enemy);

    this.playerBattleStates.set(
      player.data.map(pokemon => this.createPokemonBattleState(pokemon))
    );

    this.enemyBattleStates.set(
      enemy.data.map(pokemon => this.createPokemonBattleState(pokemon))
    );

    this.playerActiveIndex.set(0);
    this.enemyActiveIndex.set(0);

    this.battleLog.set([]);
    this.turn.set(1);
    this.isBattleOver.set(false);
    this.winner.set(null);
  }

  private createPokemonBattleState(pokemon: PokemonData): PokemonBattleState {
    const maxHP = this.pokemonService.getBaseHP(pokemon.species);
    return {
      pokemon,
      maxHP,
      currentHP: maxHP,
      fainted: false,
    };
  }

  getPlayerActive(): PokemonBattleState | null {
    const states = this.playerBattleStates();
    const index = this.playerActiveIndex();
    return states[index] ?? null;
  }

  getEnemyActive(): PokemonBattleState | null {
    const states = this.enemyBattleStates();
    const index = this.enemyActiveIndex();
    return states[index] ?? null;
  }

  /**
   * Realiza un turno de batalla con el movimiento elegido por el jugador.
   * El enemigo elige movimiento aleatorio.
   */
  doTurn(playerMoveName: string) {
    if (this.isBattleOver()) return;

    const playerActive = this.getPlayerActive();
    const enemyActive = this.getEnemyActive();

    if (!playerActive || !enemyActive) return;

    // Evitar atacar con Pokémon debilitado
    if (playerActive.fainted || enemyActive.fainted) return;

    const enemyMoveName = enemyActive.pokemon.moves[
      Math.floor(Math.random() * enemyActive.pokemon.moves.length)
    ];

    // Crear objetos CalcPokemon para calcular daño
    const playerCalc = this.toCalcPokemon(playerActive.pokemon, playerMoveName);
    const enemyCalc = this.toCalcPokemon(enemyActive.pokemon, enemyMoveName);

    const playerMove = new CalcMove(GENS, playerMoveName);
    const enemyMove = new CalcMove(GENS, enemyMoveName);

    const playerResult = calculate(GENS, playerCalc, enemyCalc, playerMove);
    const enemyResult = calculate(GENS, enemyCalc, playerCalc, enemyMove);

    const playerDamage = this.normalizeDamage(playerResult.damage);
    const enemyDamage = this.normalizeDamage(enemyResult.damage);

    // Aplicar daño
    this.applyDamageToEnemy(playerDamage);
    this.applyDamageToPlayer(enemyDamage);

    // Log del turno
    this.battleLog.update(log => [
      ...log,
      `Turn ${this.turn()}:`,
      `Your ${playerActive.pokemon.species} used ${playerMoveName} and dealt ${playerDamage} damage.`,
      `Enemy's ${enemyActive.pokemon.species} used ${enemyMoveName} and dealt ${enemyDamage} damage.`,
    ]);

    this.turn.set(this.turn() + 1);

    setTimeout(() => this.checkFainted(), 300);
  }

  private toCalcPokemon(data: PokemonData, moveName: string): CalcPokemon {
    return new CalcPokemon(GENS, data.species, {
      ability: data.ability,
      item: data.item,
      nature: data.nature,
      moves: [moveName],
    });
  }

  private normalizeDamage(
    damage: number | number[] | [number[], number[]]
  ): number {
    if (typeof damage === 'number') return damage;
    if (Array.isArray(damage[0])) return (damage[0] as number[])[0];
    return (damage as number[])[0];
  }

  private applyDamageToEnemy(damage: number) {
    const states = [...this.enemyBattleStates()];
    const activeIndex = this.enemyActiveIndex();
    const target = states[activeIndex];
    if (!target || target.fainted) return;

    target.currentHP = Math.max(0, target.currentHP - damage);
    if (target.currentHP === 0) target.fainted = true;

    this.enemyBattleStates.set(states);
  }

  private applyDamageToPlayer(damage: number) {
    const states = [...this.playerBattleStates()];
    const activeIndex = this.playerActiveIndex();
    const target = states[activeIndex];
    if (!target || target.fainted) return;

    target.currentHP = Math.max(0, target.currentHP - damage);
    if (target.currentHP === 0) target.fainted = true;

    this.playerBattleStates.set(states);
  }

  /**
   * Revisa si un Pokémon ha fainted y controla el cambio o fin de batalla.
   */
  private checkFainted() {
    // Chequear si el enemigo fainted
    const enemyActive = this.getEnemyActive();
    if (enemyActive && enemyActive.fainted) {
      const next = this.getNextAlive(this.enemyBattleStates());
      if (next !== null) {
        const nextPokemon = this.playerBattleStates()[next];

        this.battleLog.update(log => [...log, `Enemy switched to ${nextPokemon.pokemon.species}.`]);
        this.enemyActiveIndex.set(next);
      } else {
        this.battleLog.update(log => [...log, 'You won the battle!']);
        this.isBattleOver.set(true);
        this.winner.set('player');
      }
    }

    // Chequear si el jugador fainted
    const playerActive = this.getPlayerActive();
    if (playerActive && playerActive.fainted) {
      const next = this.getNextAlive(this.playerBattleStates());
      if (next !== null) {
        this.battleLog.update(log => [...log, `You switched to ${this.playerBattleStates()[next].pokemon.species}.`]);
        this.playerActiveIndex.set(next);
      } else {
        this.battleLog.update(log => [...log, 'You lost the battle.']);
        this.isBattleOver.set(true);
        this.winner.set('enemy');
      }
    }
  }

  /**
   * Devuelve índice del próximo Pokémon no debilitado en el equipo,
   * o null si no queda ninguno.
   */
  private getNextAlive(states: PokemonBattleState[]): number | null {
    for (let i = 0; i < states.length; i++) {
      if (!states[i].fainted) return i;
    }
    return null;
  }

  /**
   * Permite al jugador cambiar manualmente de Pokémon,
   * si no está fainted y es distinto al activo actual.
   */
  playerSwitchTo(index: number): boolean {
    if (this.isBattleOver()) return false;

    const states = this.playerBattleStates();
    if (index < 0 || index >= states.length) return false;

    const target = states[index];
    if (target.fainted) return false;

    if (this.playerActiveIndex() === index) return false;

    this.playerActiveIndex.set(index);

    this.battleLog.update(log => [...log, `You switched to ${target.pokemon.species}.`]);

    return true;
  }
}