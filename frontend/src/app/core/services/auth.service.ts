import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Player, PlayerLogin, SinglePlayerResponse } from '../interfaces/player.interface';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    // private apiUrl = `${environment.apiUrl}`;
    private http = inject(HttpClient);
    private logged: WritableSignal<boolean> = signal(false);
    private router = inject(Router);

    /**
     *
     *
     * @param {Player} playerData
     * @return {*}  {Observable<Player>}
     * @memberof AuthService
     */
    register(playerData: Player): Observable<Player> {
        return this.http
            .post<SinglePlayerResponse>(`auth/register`, playerData)
            .pipe(map((resp: SinglePlayerResponse) => resp.data));
    }

    /**
     *
     *
     * @param {PlayerLogin} playerData
     * @return {*}  {Observable<string>}
     * @memberof AuthService
     */
    login(playerData: PlayerLogin): Observable<string> {
        return this.http
            .post<LoginResponse>(`auth/login`, playerData)
            .pipe(
                map((resp: LoginResponse) => {
                    localStorage.setItem('accessToken', resp.accessToken);
                    return resp.accessToken;
                })
            );
    }

    /**
     *
     *
     * @return {*}  {Observable<Player>}
     * @memberof AuthService
     */
    getLoggedPlayer(): Observable<Player> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }

        return this.http
            .get<SinglePlayerResponse>(`player/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .pipe(map((resp: SinglePlayerResponse) => resp.data));
    }

    /**
     *
     *
     * @return {*}  {Observable<boolean>}
     * @memberof AuthService
     */
    validateToken(): Observable<boolean> {
        return this.http.get('auth/validate').pipe(
            map(() => {
                this.logged.set(true);
                return true;
            }),
            catchError(() => {
                localStorage.removeItem('accessToken');
                this.logged.set(false);
                return of(false);
            })
        );
    }

    /**
     *
     *
     * @return {*}  {Observable<boolean>}
     * @memberof AuthService
     */
    isLogged(): Observable<boolean> {
        const token = localStorage.getItem('accessToken');

        if (!token) return of(false);
        if (this.logged()) return of(true);

        return this.validateToken();
    }

}
