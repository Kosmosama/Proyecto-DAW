import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styles: ``
})
export class NavbarComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout()
  }
}
