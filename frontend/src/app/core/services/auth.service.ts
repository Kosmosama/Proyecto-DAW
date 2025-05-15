import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
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

    private logged: WritableSignal<boolean> = signal(false);

    private accessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);
    private refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_KEY);

    /**
     * Returns headers with the current access token for authorized requests.
     */
    getAuthHeaders() {
        if (!this.accessToken) throw new Error('No access token found');
        return { Authorization: `Bearer ${this.accessToken}` };
    }

    /**
     * Gets the current access token.
     * @returns {string} - The current access token.
     */
    getAuth() {
        if (!this.accessToken) throw new Error('No access token found');
        return this.accessToken;
    }

    /**
     * Registers a new player.
     * @param {Player} playerData - Player registration data.
     * @returns {Observable<Player>} - Observable emitting the registered player data.
     */
    register(playerData: Player): Observable<Player> {
        return this.http.post<PlayerResponse>(`auth/register`, playerData).pipe(
            map((resp) => resp.data)
        );
    }

    /**
     * Logs in the user and stores tokens.
     * @param {PlayerLogin} playerData - Player login data.
     * @returns {Observable<void>} - Observable indicating login success.
     */
    login(playerData: PlayerLogin): Observable<void> {
        return this.http.post<LoginResponse>(`auth/login`, playerData).pipe(
            tap((response) => {
                this.setTokens(response.data.accessToken, response.data.refreshToken);
                this.logged.set(true);
                this.statusSocketService.connect(this.accessToken!);
                this.router.navigate(['/dashboard']); // Redirect after login
            }),
            map(() => void 0)
        );
    }

    /**
     * Initiates Google OAuth login.
     * @returns {void}
     */
    googleLogin(): void {
        window.location.href = `${environment.apiUrl}/auth/google/login`;
    }

    /**
     * Initiates GitHub OAuth login.
     * @returns {void}
     */
    githubLogin(): void {
        window.location.href = `${environment.apiUrl}/auth/github/login`;
    }

    /**
     * Validates the stored token with the server.
     * Can be used in guards to pre-authenticate users.
     * @returns {Observable<boolean>} - Observable emitting true if token is valid, false otherwise.
     */
    validateToken(): Observable<boolean> {
        if (!this.accessToken) {
            return of(false);
        }

        return this.http.get('auth/validate', { headers: this.getAuthHeaders() }).pipe(
            tap(() => {
                this.logged.set(true);
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
     * Checks if the user is logged in based on cached state or validates token.
     * @returns {Observable<boolean>} - Observable emitting true if logged in, false otherwise.
     */
    isLogged(): Observable<boolean> {
        if (!this.accessToken) return of(false);
        if (this.logged()) return of(true);
        return this.validateToken();
    }

    /**
     * Logs out the user, clears tokens and navigates to login page.
     * @returns {void}
     */
    logout(): void {
        this.statusSocketService.disconnect();
        this.clearAuth();
        this.router.navigate(['/auth/login']);
    }

    /**
     * Caches and stores access and refresh tokens.
     * @param {string} access - Access token.
     * @param {string} refresh - Refresh token.
     * @returns {void}
     */
    private setTokens(access: string, refresh: string): void {
        this.accessToken = access;
        this.refreshToken = refresh;
        localStorage.setItem(ACCESS_TOKEN_KEY, access);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }

    /**
     * Clears tokens from local storage and updates logged state.
     * @returns {void}
     */
    private clearAuth(): void {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        this.logged.set(false);
    }
}
