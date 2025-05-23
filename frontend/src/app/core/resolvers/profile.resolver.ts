import { ResolveFn } from '@angular/router';
import { PlayerService } from '../services/player.service';
import { Player } from '../interfaces/player.model';
import { inject } from '@angular/core';

export const profileResolver: ResolveFn<Player> = (route) => {
  const playerService = inject(PlayerService);
  if (route.params['id']) {
    return playerService.getProfile(+route.params['id']);
  }
  return playerService.getProfile();
};