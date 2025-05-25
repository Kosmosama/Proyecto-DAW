import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../interfaces/auth.model';
import { Player, PlayerLogin, PlayerResponse } from '../interfaces/player.model';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    #logged: WritableSignal<boolean> = signal(false);

    get logged(): Signal<boolean> {
        return this.#logged.asReadonly();
    }

    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        console.log("AuthService created");
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    /**
     * Returns the current access token.
     */
    getAccessToken(): string | null {
        return this.accessToken;
    }

    /**
     * Registers a new player.
     */
    register(playerData: Player): Observable<Player> {
        return this.http.post<PlayerResponse>('auth/register', playerData).pipe(
            map((resp) => resp.data)
        );
    }

    /**
     * Logs in the user with credentials and stores tokens.
     */
    login(playerData: PlayerLogin): Observable<void> {
        return this.http.post<LoginResponse>('auth/login', playerData).pipe(
            map(({ data }) => {
                this.setTokens(data.accessToken, data.refreshToken);
                this.#logged.set(true);
                // this.statusSocketService.connect(data.accessToken);
                this.router.navigate(['/dashboard']);
                return;
            })
        );
    }

    /**
     * Logs in using Google OAuth.
     */
    googleLogin(): void {
        this.redirectToOAuth('google');
    }

    /**
     * Logs in using GitHub OAuth.
     */
    githubLogin(): void {
        this.redirectToOAuth('github');
    }

    /**
     * Redirects to OAuth login endpoint.
     */
    private redirectToOAuth(provider: 'google' | 'github'): void {
        if (typeof window !== 'undefined') {
            const url = `${environment.apiUrl}/auth/${provider}/login`;
            window.location.href = url;
        }
    }

    /**
     * Refreshes the current access token with the refreshToken.
     */
    public refreshAccessToken(): Observable<boolean> {
        if (!this.refreshToken) return of(false);

        return this.http.post<LoginResponse>('auth/refresh', {}, {
            headers: { Authorization: `Bearer ${this.refreshToken}` }
        }).pipe(
            map(({ data }) => {
                this.setTokens(data.accessToken, data.refreshToken);
                this.#logged.set(true);
                return true;
            }),
            catchError(() => {
                this.clearAuth();
                return of(false);
            })
        );
    }

    /**
     * 
     * @returns boolean
     * Validates logged user's accessToken
     */

    validateToken(): Observable<boolean> {
        return this.http.get('auth/validate').pipe(
            map(() => true),
            catchError(() => {
                this.clearAuth();
                return of(false);
            })
        );
    }



    /**
     * Determines whether the user is logged in.
     */
    isLogged(): Observable<boolean> {
        if (this.#logged()) return of(true);
        if (!this.accessToken) return of(false);
        return this.validateToken();
    }

    /**
     * Logs out the user and clears all authentication data.
     */
    logout(): void {
        this.http.post('auth/logout', {}).subscribe(); // opcionalmente manejar errores
        this.clearAuth();
        this.router.navigate(['/auth/login']);
    }


    /**
     * Stores tokens in memory and localStorage.
     */
    private setTokens(access: string, refresh: string): void {
        this.accessToken = access;
        this.refreshToken = refresh;
        localStorage.setItem(ACCESS_TOKEN_KEY, access);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }

    /**
     * Clears tokens from memory and localStorage.
     */
    private clearAuth(): void {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        this.#logged.set(false);
    }
}
