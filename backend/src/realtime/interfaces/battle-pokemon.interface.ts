import { PokemonSet } from "@pkmn/data";

export interface BattlePokemon extends PokemonSet {
    currentHp: number;
    fainted: boolean;
}