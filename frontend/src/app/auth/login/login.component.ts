import { Component, inject, signal } from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CanComponentDeactivate } from '../../core/guards/leave-page.guard';
import { PlayerLogin } from '../../core/interfaces/player.model';
import { AuthService } from '../../core/services/auth.service';
import { LoadGoogleApiService } from '../../core/services/load-google-api.service';
import { ConfirmModalComponent } from '../../shared/components/modals/confirm-modal/confirm-modal.component';
import { GoogleLoginDirective } from '../../shared/directives/google-login.directive';
import { ValidationClassesDirective } from '../../shared/directives/validation-classes.directive';

@Component({
  standalone: true,
  selector: 'login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ValidationClassesDirective,
    GoogleLoginDirective,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: [RouterLink, ReactiveFormsModule, LoadGoogleApiService],
})
export class LoginComponent implements CanComponentDeactivate {
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private modal = inject(NgbModal);

  private saved = false;
  errors = signal<number>(0);

  constructor() { }

  loggedGoogle() {
    try {
      this.authService.googleLogin();
    } catch (error) {
      this.showError('Google login failed');
    }
  }

  loggedGithub() {
    this.authService.githubLogin();
  }

  showError(error: string) {
    console.error(error);
  }

  login(): void {
    const player: PlayerLogin = {
      ...this.loginForm.getRawValue(),
    };

    this.authService
      .login(player)
      .subscribe({
        next: () => {
          this.saved = true;
          this.router.navigate(['pages/home']);
        },
        error: (error) => {
          this.errors.set(error.status);
          console.error(error);
        },
      });
  }

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  canDeactivate() {
    if (this.saved || this.loginForm.pristine) {
      return true;
    }
    const modalRef = this.modal.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Changes not saved';
    modalRef.componentInstance.body = 'Do you want to leave the page?';
    return modalRef.result.catch(() => false);
  }
}

