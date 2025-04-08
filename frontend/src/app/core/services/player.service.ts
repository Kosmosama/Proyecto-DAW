import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Player } from '../interfaces/player.interface';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private apiUrl = `${environment.API_URL}`;
    private http = inject(HttpClient);

    getFriends(): Observable<Player[]> {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No access token found');
        }

        return this.http
            .get<Player[]>(`${this.apiUrl}/player/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    }


}
