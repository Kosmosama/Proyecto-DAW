import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CanComponentDeactivate } from '../../core/guards/leave-page.guard';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmModalComponent } from '../../shared/components/modals/confirm-modal/confirm-modal.component';
import { ValidationClassesDirective } from '../../shared/directives/validation-classes.directive';
// import { GoogleLoginDirective } from '../google-login/google-login.directive';
import { map } from 'rxjs';
import { PlayerLogin } from '../../core/interfaces/player.interface';

@Component({
  standalone: true,
  selector: 'login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ValidationClassesDirective,
    // GoogleLoginDirective,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements CanComponentDeactivate {
  #router = inject(Router);
  #fb = inject(NonNullableFormBuilder);
  #authService = inject(AuthService);
  #destroyRef = inject(DestroyRef);
  #saved = false;
  #modal = inject(NgbModal);
  errors = signal<number>(0);

  constructor() {
  }

  showError(error: string) {
    console.error(error);
  }

  login(): void {
    const player: PlayerLogin = {
      ...this.loginForm.getRawValue(),
    };

    this.#authService
      .login(player)
      .pipe(
        map(() => {
          this.#saved = true;
          this.#router.navigate(['player/friendList']);
        })
      )
      .subscribe({
        error: (error) => {
          this.errors.set(error.status);
        },
      });
  }


  loginForm = this.#fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  canDeactivate() {
    if (this.#saved || this.loginForm.pristine) {
      return true;
    }
    const modalRef = this.#modal.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Changes not saved';
    modalRef.componentInstance.body = 'Do you want to leave the page?';
    return modalRef.result.catch(() => false);
  }
}

// googleUserLogin(resp: google.accounts.id.CredentialResponse): void {
//   const userData: GoogleFbLogin = {
//     token: resp.credential,
//     lat: 0,
//     lng: 0,
//   };

//   this.#authService
//     .googleFbLogin(userData)
//     .pipe(takeUntilDestroyed(this.#destroyRef))
//     .subscribe(() => {
//       this.#router.navigate(['/events']);
//     });
// }


