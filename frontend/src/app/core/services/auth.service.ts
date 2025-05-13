import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../interfaces/auth.model';
import { Player, PlayerLogin, PlayerResponse } from '../interfaces/player.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private logged: WritableSignal<boolean> = signal(false);
    private router = inject(Router);

    getAuthHeaders() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return { Authorization: `Bearer ${token}` };
    }

    /**
     *
     *
     * @param {Player} playerData
     * @return {*}  {Observable<Player>}
     * @memberof AuthService
     */
    register(playerData: Player): Observable<Player> {
        return this.http
            .post<PlayerResponse>(`auth/register`, playerData)
            .pipe(map((resp: PlayerResponse) => resp.data));
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
                    localStorage.setItem('accessToken', resp.data.accessToken);
                    return resp.data.accessToken;
                })
            );
    }


    /**
     *
     *
     * @memberof AuthService
     */
    googleLogin(): void {
        window.location.href = `${environment.apiUrl}/auth/google/login`;
    }

    githubLogin(): void {
        window.location.href = `${environment.apiUrl}/auth/github/login`;
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

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.logged.set(false);
        this.router.navigate(['auth/login']);
    }
}
