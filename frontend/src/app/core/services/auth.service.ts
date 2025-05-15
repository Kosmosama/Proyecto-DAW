import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../interfaces/auth.model';
import { Player, PlayerLogin, PlayerResponse } from '../interfaces/player.model';
import { StatusSocketService } from './statusSocket.service';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private statusSocketService = inject(StatusSocketService);

    #logged: WritableSignal<boolean> = signal(false);

    get logged(): Signal<boolean> {
        return this.#logged.asReadonly();
    }

    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        }
    }

    /**
     * Returns authorization headers.
     */
    getAuthHeaders() {
        if (!this.accessToken) throw new Error('No access token found');
        return { Authorization: `Bearer ${this.accessToken}` };
    }

    /**
     * Returns the access token.
     */
    getAuth(): string {
        if (!this.accessToken) throw new Error('No access token found');
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
            tap(({ data }) => {
                this.setTokens(data.accessToken, data.refreshToken);
                this.#logged.set(true);
                this.statusSocketService.connect(data.accessToken);
                this.router.navigate(['/dashboard']);
            }),
            map(() => void 0)
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
     * Validates the current access token with the server.
     */
    private validateToken(): Observable<boolean> {
        if (!this.accessToken) return of(false);

        return this.http.get('auth/validate', { headers: this.getAuthHeaders() }).pipe(
            tap(() => {
                this.#logged.set(true);
                this.statusSocketService.connect(this.accessToken!);
            }),
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
        this.statusSocketService.disconnect();
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
