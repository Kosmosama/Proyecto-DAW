import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Player, SinglePlayerResponse } from '../interfaces/player.interface';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private apiUrl = `${environment.API_URL}`;
    private http = inject(HttpClient);

    register(playerData: Player): Observable<Player> {
        return this.http
            .post<SinglePlayerResponse>(`${this.apiUrl}/auth/register`, playerData)
            .pipe(map((resp: SinglePlayerResponse) => resp.data));
    }

    login(playerData: Player): Observable<string> {
        return this.http
            .post<LoginResponse>(`${this.apiUrl}/auth/login`, playerData)
            .pipe(
                map((resp: LoginResponse) => {
                    localStorage.setItem('access_token', resp.accessToken);
                    return resp.accessToken;
                })
            );
    }

    getLoggedPlayer(): Observable<Player> {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No access token found');
        }

        return this.http
            .get<SinglePlayerResponse>(`${this.apiUrl}/player/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .pipe(map((resp: SinglePlayerResponse) => resp.data));
    }

}
