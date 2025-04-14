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

        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return this.http
            .get<Player[]>(`player/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });

    }

    /**
     *
     *
     * @return {*}  {Observable<Player[]>}
     * @memberof PlayerService
     */
    getPlayers(): Observable<Player[]> {

        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return this.http
            .get<Player[]>(`player`, {
                headers: { Authorization: `Bearer ${token}` }
            });

    }

    /**
     *
     *
     * @param {string} id
     * @return {*}  {Observable<any>}
     * @memberof PlayerService
     */
    sendFriendRequest(id: number): Observable<any> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return this.http
            .post<any>(`player/friend-request/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
    }

    /**
     *
     *
     * @param {number} id
     * @return {*}  {Observable<any>}
     * @memberof PlayerService
     */
    acceptFriendRequest(id: number): Observable<any> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return this.http.patch<any>(`player/friend-accept/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    /**
     *
     *
     * @param {number} id
     * @return {*}  {Observable<any>}
     * @memberof PlayerService
     */
    declineFriendRequest(id: number): Observable<any> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return this.http.patch<any>(`player/friend-decline/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    /**
     *
     *
     * @return {*}  {Observable<any[]>}
     * @memberof PlayerService
     */
    fetchIncomingRequests(): Observable<any[]> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return this.http
            .get<any[]>(`player/friend-requests/incoming`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    }

    /**
     *
     *
     * @return {*}  {Observable<any[]>}
     * @memberof PlayerService
     */
    fetchOutgoingRequests(): Observable<any[]> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return this.http
            .get<any[]>(`player/friend-requests/outgoing`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    }

}
