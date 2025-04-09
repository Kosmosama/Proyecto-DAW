import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../interfaces/player.interface';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private http = inject(HttpClient);

    /**
     *
     *
     * @return {*}  {Observable<Player[]>}
     * @memberof PlayerService
     */
    getFriends(): Observable<Player[]> {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No access token found');
        }

        return this.http
            .get<Player[]>(`player/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    }


}
