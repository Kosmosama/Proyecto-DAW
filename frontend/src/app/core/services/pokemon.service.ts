import { Injectable } from '@angular/core';
import { Dex } from '@pkmn/dex';
import { Sprites } from '@pkmn/img';

@Injectable({
    providedIn: 'root'
})
export class PokemonService {


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

    getPokemonSprite(name: string, shiny = false): string {
        const { url, w, h, pixelated } = Sprites.getPokemon(name.toLowerCase(), { gen: 'ani', shiny });
        return url;
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

    getBaseHP(name: string): number {
        const species = Dex.species.get(name);
        if (!species || !species.baseStats.hp) return 1;

        const base = species.baseStats.hp;
        const iv = 31;
        const ev = 0;
        const level = 100;

        const hp = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
        return hp;
    }


}