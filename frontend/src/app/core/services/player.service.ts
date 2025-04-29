import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../interfaces/player.interface';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private http = inject(HttpClient);

    getPlayer(): Observable<Player> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        return this.http
            .get<Player>(`player/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    }

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
     * @param {{ search?: string; excludeIds?: number[] }} [params]
     * @return {*}  {Observable<Player[]>}
     * @memberof PlayerService
     */
    getPlayers(params: { page?: number, search?: string; excludeIds?: number[] } = {}): Observable<Player[]> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }

        const queryParams = new HttpParams({
            fromObject: {
                ...(params.page ? { page: params.page.toString() } : {}),
                ...(params.search ? { search: params.search } : {}),
                ...(params.excludeIds ? params.excludeIds.reduce((acc, id) => {
                    acc['excludeIds'] = [...(acc['excludeIds'] || []), id.toString()];
                    return acc;
                }, {} as any) : {})
            }
        });

        return this.http.get<Player[]>(`player`, {
            headers: { Authorization: `Bearer ${token}` },
            params: queryParams
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
