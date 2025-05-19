import { Injectable } from '@angular/core';
import { Dex } from '@pkmn/dex';
import { Learnsets } from '@pkmn/data';


@Injectable({
    providedIn: 'root'
})
export class TeamBuilderService {


    constructor() {
    }

    getSpecies(): string[] {
        return Dex.species.all().map(species => species.name);
    }

    getAbilities(): string[] {
        return Dex.abilities.all().map(ability => ability.name);
    }

    getItems(): string[] {
        return Dex.items.all().map(item => item.name);
    }

    getMoves(): string[] {
        return Dex.moves.all().map(move => move.name);
    }

    async getSpeciesData(name: string): Promise<{ abilities: string[]; moves: string[] }> {
        const species = Dex.species.get(name);
        if (!species) return { abilities: [], moves: [] };

        const abilities = Object.values(species.abilities ?? {});
        const id = species.id;

        const learnset = (await Dex.learnsets.get(id))?.learnset ?? {};        
        const moves = Object.keys(learnset);

        return { abilities, moves };
    }

}