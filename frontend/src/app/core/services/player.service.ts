import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Player, SinglePlayerResponse } from '../interfaces/player.interface';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private apiUrl = `${environment.API_URL}/player`;
    private http = inject(HttpClient);

    register(playerData: Player): Observable<Player> {
        return this.http
            .post<SinglePlayerResponse>(`${this.apiUrl}`, playerData)
            .pipe(map((resp: SinglePlayerResponse) => resp.data));
    }
}
