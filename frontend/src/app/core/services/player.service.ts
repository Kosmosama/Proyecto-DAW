import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { FriendRequestsResponse, Player, PlayerProfileUpdate, PlayerProfileUpdateResponse, PlayerResponse, PlayersResponse } from '../interfaces/player.model';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private http = inject(HttpClient);
    private defaultAvatar: string = '/images/icons/default-avatar.jpg';

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

    fetchAvatarImages(): Observable<string[]> {
        return new Observable<string[]>((observer) => {
            fetch('/images/avatars/avatar-list.json')
                .then(res => res.json())
                .then((avatars: string[]) => {
                    observer.next(avatars.map(name => name.replace('.jpg', '.jpg')));
                    observer.complete();
                })
                .catch(err => {
                    observer.error(err);
                });
        });
    }

    setDefaultAvatar(event: Event): void {
        const target = event.target as HTMLImageElement;
        target.src = this.defaultAvatar;
    }

    updatePlayerProfile(newProfileData: PlayerProfileUpdate): Observable<PlayerProfileUpdateResponse> {
        return this.http.patch<PlayerProfileUpdateResponse>('player/profile', newProfileData);
    }

}
