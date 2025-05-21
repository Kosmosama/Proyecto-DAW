export interface PokemonEVs {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokemonData {
  species: string;
  ability: string;
  item: string;
  teraType: string;
  nature: string;
  moves: string[];
  spriteUrl?: string;
}