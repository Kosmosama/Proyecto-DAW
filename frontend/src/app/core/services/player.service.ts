import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Player, PlayerResponse, PlayersResponse } from '../interfaces/player.model';
import { AuthService } from './auth.service';
import { ApiResponse } from '../interfaces/api-response.model';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    getProfile(): Observable<PlayerResponse> {
        return this.http
            .get<PlayerResponse>(`player/profile`);
    }

    /**
     *
     *
     * @return {*}  {Observable<Player[]>}
     * @memberof PlayerService
     */
    getFriends(): Observable<PlayersResponse> {
        return this.http
            .get<PlayersResponse>(`player/friends`);

    }

    /**
     *
     *
     * @param {{ search?: string; excludeIds?: number[] }} [params]
     * @return {*}  {Observable<Player[]>}
     * @memberof PlayerService
     */
    getPlayers(params: { page?: number, search?: string; excludeIds?: number[] } = {}): Observable<PlayersResponse> {
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

        return this.http.get<PlayersResponse>(`player`, {
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
        return this.http
            .post<any>(`player/friend-request/${id}`, {});
    }

    /**
     *
     *
     * @param {number} id
     * @return {*}  {Observable<any>}
     * @memberof PlayerService
     */
    acceptFriendRequest(id: number): Observable<any> {
        return this.http.patch<any>(`player/friend-accept/${id}`, {});
    }

    /**
     *
     *
     * @param {number} id
     * @return {*}  {Observable<any>}
     * @memberof PlayerService
     */
    declineFriendRequest(id: number): Observable<any> {
        return this.http.patch<any>(`player/friend-decline/${id}`, {});
    }

    /**
     *
     *
     * @return {*}  {Observable<any[]>}
     * @memberof PlayerService
     */
    fetchIncomingRequests(): Observable<ApiResponse<any[]>> {
        return this.http
            .get<ApiResponse<any[]>>(`player/friend-requests/incoming`);
    }

    /**
     *
     *
     * @return {*}  {Observable<any[]>}
     * @memberof PlayerService
     */
    fetchOutgoingRequests(): Observable<ApiResponse<any[]>> {
        return this.http
            .get<ApiResponse<any[]>>(`player/friend-requests/outgoing`);
    }

}
