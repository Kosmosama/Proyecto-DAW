import { inject, Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { Player } from '../interfaces/player.model';
import { PlayerService } from '../services/player.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileResolver implements Resolve<Player> {
  private playerService = inject(PlayerService);

  resolve(): Observable<Player> {
    return this.playerService.getProfile();
  }
}
