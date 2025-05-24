import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthFeedbackService } from '../services/auth-feedback.service';

export const loginActivateGuard: CanActivateFn = (): Observable<
  boolean | UrlTree
> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const feedbackService = inject(AuthFeedbackService);

  return authService.isLogged().pipe(
    map((isLoggedIn) => {
      if (!isLoggedIn) {
        feedbackService.notifyLoginRequired();
        // return router.createUrlTree(['/auth/login']);
        return false;
      }
      return true;
    })
  );
};