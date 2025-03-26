import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Player } from '../interfaces/player.interface';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private apiUrl = `${environment.API_URL}/player`;
  private http = inject(HttpClient);

  register(playerData: Player): Observable<any> {
    return this.http.post(`${this.apiUrl}`, playerData);
  }

}
