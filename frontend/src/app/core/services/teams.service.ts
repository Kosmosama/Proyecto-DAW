import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Team } from '../interfaces/team.model';


@Injectable({
    providedIn: 'root'
})
export class TeamsService {

    private http = inject(HttpClient);

    postTeam(teamName: string, teamData: string): Observable<void> {
        return this.http.post<void>('teams', { name: teamName, data: { team: teamData } });
    }

    getTeams(playerId?: number) {
        const params = playerId ? { params: { playerId } } : {};
        return this.http.get<{ data: Team[] }>('teams', params);
    }

    getTeamById(id: string): Observable<Team> {
        return this.http.get<Team>(`teams/${id}`);
    }

    editTeam(id: string, teamName: string, teamData: string): Observable<void> {
        return this.http.patch<void>(`teams/${id}`, { name: teamName, data: { team: teamData } });
    }

    deleteTeam(id: string): Observable<void> {
        return this.http.delete<void>(`teams/${id}`);
    }

    parseTeam(team: {
        name: string;
        item: string;
        ability: string;
        teraType: string;
        EVs: { HP: number; Atk: number; Def: number; SpA: number; SpD: number; Spe: number };
        nature: string;
        moves: { move1: string; move2: string; move3: string; move4: string };
    }[]): string {
        return team.map(p => `${p.name} @ ${p.item}
Ability: ${p.ability}
Tera Type: ${p.teraType}
EVs: ${p.EVs.HP} HP / ${p.EVs.Atk} Atk / ${p.EVs.Def} Def / ${p.EVs.SpA} SpA / ${p.EVs.SpD} SpD / ${p.EVs.Spe} Spe
${p.nature} Nature
- ${p.moves.move1}
- ${p.moves.move2}
- ${p.moves.move3}
- ${p.moves.move4}`).join('\n\n');
    }

}