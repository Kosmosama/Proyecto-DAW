import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'oauth-callback',
  templateUrl: './oauth-callback.component.html',
})
export class OAuthCallbackComponent implements OnInit {
  #router = inject(Router);

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    // const redirectTo = params.get('redirectTo') || '/pages/home';

    if (token && refreshToken) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      this.#router.navigate(['/pages/home']);
    } else {
      this.#router.navigate(['/auth/login']);
    }
  }
}
