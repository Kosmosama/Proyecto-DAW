import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const loginActivateGuard: CanActivateFn = (): Observable<
  boolean | UrlTree
> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLogged().pipe(
    map((isLoggedIn) => {
      if (!isLoggedIn) {
        return router.createUrlTree(['/auth/login']);
      }
      return true;
    })
  );
};