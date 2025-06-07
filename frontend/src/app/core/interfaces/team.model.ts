import { ApiResponse } from "./api-response.model";
import { PokemonData } from "./pokemon.model";

export interface Team {
    id: number;
    name: string;
    data: PokemonData[];
    format?: string;
    strict?: boolean;
}

export type TeamResponse = ApiResponse<Team>;