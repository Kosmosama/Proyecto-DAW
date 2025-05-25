import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './services/auth.service';

export function authInit(): () => Promise<boolean> {
  const authService = inject(AuthService);
  return () => firstValueFrom(authService.isLogged());
}
