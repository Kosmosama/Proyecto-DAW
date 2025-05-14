import { inject, Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { PlayerResponse } from '../interfaces/player.model';
import { PlayerService } from '../services/player.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileResolver implements Resolve<PlayerResponse> {
  private playerService = inject(PlayerService);

  resolve(): Observable<PlayerResponse> {
    return this.playerService.getProfile();
  }
}
