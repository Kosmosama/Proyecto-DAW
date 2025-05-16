import { Injectable } from '@angular/core';
import { Dex } from '@pkmn/dex';

@Injectable({
    providedIn: 'root'
})
export class PokemonService {

    constructor() { }

    getSpecies(): string[] {
        return Dex.species.all().map(species => species.name);
    }

    getSpeciesJson(): string {
        return JSON.stringify(this.getSpecies());
    }

}