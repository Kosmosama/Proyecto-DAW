import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { FriendRequestsResponse, Player, PlayerResponse, PlayersResponse } from '../interfaces/player.model';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private http = inject(HttpClient);

    getProfile(id?: number): Observable<Player> {
        if (id) {
            return this.http
                .get<PlayerResponse>(`player/${id}`).pipe(
                    map((response) => response.data),
                );
        }
        return this.http.get<PlayerResponse>('player/profile').pipe(map((response) => response.data),
        );
    }

    /**
     *
     *
     * @return {*}  {Observable<Player[]>}
     * @memberof PlayerService
     */
    getFriends(): Observable<Player[]> {
        return this.http
            .get<PlayersResponse>(`player/friends`).pipe(
                map((response: PlayersResponse) => response.data)
            );

    }

    /**
     *
     *
     * @param {{ page?: number; search?: string; excludeIds?: number[] }} [params]
     * @return {*}  {Observable<PlayersResponse>}
     * @memberof PlayerService
     */
    getPlayers(params: { page?: number; search?: string; excludeIds?: number[] } = {}): Observable<Player[]> {
        let queryParams = new HttpParams();

        if (params.page) {
            queryParams = queryParams.set('page', params.page.toString());
        }

        if (params.search) {
            queryParams = queryParams.set('search', params.search);
        }

        if (params.excludeIds) {
            params.excludeIds.forEach(id => {
                queryParams = queryParams.append('excludeIds', id.toString());
            });
        }

        return this.http.get<PlayersResponse>('player', { params: queryParams }).pipe(
            map((response: PlayersResponse) => response.data)
        );
    }



    /**
     *
     *
     * @param {string} id
     * @return {*}  {Observable<void>}
     * @memberof PlayerService
     */
    sendFriendRequest(id: number): Observable<void> {
        return this.http
            .post<void>(`player/friend-request/${id}`, {});
    }

    /**
     *
     *
     * @param {number} id
     * @return {*}  {Observable<void>}
     * @memberof PlayerService
     */
    acceptFriendRequest(id: number): Observable<void> {
        return this.http.patch<void>(`player/friend-accept/${id}`, {});
    }

    /**
     *
     *
     * @param {number} id
     * @return {*}  {Observable<void>}
     * @memberof PlayerService
     */
    declineFriendRequest(id: number): Observable<void> {
        return this.http.patch<void>(`player/friend-decline/${id}`, {});
    }

    /**
     *
     *
     * @return {*}  {Observable<FriendRequestsResponse>}
     * @memberof PlayerService
     */
    fetchIncomingRequests(): Observable<FriendRequestsResponse> {
        return this.http
            .get<FriendRequestsResponse>(`player/friend-requests/incoming`);
    }

    /**
     *
     *
     * @return {*}  {Observable<FriendRequestsResponse>}
     * @memberof PlayerService
     */
    fetchOutgoingRequests(): Observable<FriendRequestsResponse> {
        return this.http
            .get<FriendRequestsResponse>(`player/friend-requests/outgoing`);
    }

}
