import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class TeamsService {

    private http = inject(HttpClient);

    postTeam(teamName: string, teamData: string): Observable<void> {
        return this.http.post<void>('teams', { teamName, teamData });
    }

    getTeams(): Observable<string[]> {
        return this.http.get<string[]>('teams');
    }

    parseTeam(team: {
        name: string;
        item: string;
        ability: string;
        teraType: string;
        nature: string;
        evs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };  // <-- objeto

        moves: { move1: string; move2: string; move3: string; move4: string };
    }[]): string {
        return team.map(p => `${p.name} @ ${p.item}
Ability: ${p.ability}
Tera Type: ${p.teraType}
EVs: ${p.evs}
${p.nature} Nature
- ${p.moves.move1}
- ${p.moves.move2}
- ${p.moves.move3}
- ${p.moves.move4}`).join('\n\n');
    }


}