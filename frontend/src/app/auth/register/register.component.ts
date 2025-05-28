import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CanComponentDeactivate } from '../../core/guards/leave-page.guard';
import { Player } from '../../core/interfaces/player.model';
import { AuthService } from '../../core/services/auth.service';
import { PlayerService } from '../../core/services/player.service';
import { ConfirmModalComponent } from '../../shared/components/modals/confirm-modal/confirm-modal.component';
import { ValidationClassesDirective } from '../../shared/directives/validation-classes.directive';
import { matchPassword } from '../../shared/validators/match-password.validator';
import { AvatarSelectorComponent } from '../../shared/components/avatar-selector/avatar-selector.component';

@Component({
  standalone: true,
  selector: 'register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ValidationClassesDirective,
    RouterLink,
    AvatarSelectorComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements CanComponentDeactivate {

  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private modal = inject(NgbModal);
  private playerService = inject(PlayerService);

  private saved = false;

  availableAvatars = signal<string[]>([]);
  selectedAvatar = signal<string | null>(null);

  currentStep = signal<1 | 2>(1);

  errors = signal<number>(0);

  registerForm = this.fb.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      password2: ['', [Validators.required, Validators.minLength(4)]],
      avatar: [],
    },
    { validators: matchPassword('password', 'password2') }
  );

  constructor() {
    this.playerService.fetchAvatarImages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((avatars: string[]) => {
        this.availableAvatars.set(avatars.map(name => name.replace('.jpg', '.jpg')));
      });
  }


  addPlayer() {
    if (this.currentStep() === 1) {
      if (this.registerForm.valid) {
        this.currentStep.set(2);
      } else {
        this.registerForm.markAllAsTouched();
      }
      return;
    }

    const rawValue = this.registerForm.getRawValue();

    const player: Player = {
      username: rawValue.name,
      email: rawValue.email,
      password: rawValue.password,
      photo: this.selectedAvatar() ?? ''
    };

    this.authService
      .register(player)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saved = true;
          this.router.navigate(['auth/login']);
        },
        error: (error) => {
          this.errors.set(error.status);
          window.scrollTo(0, 0);
        }
      });
  }


  selectAvatar(filename: string) {
    this.selectedAvatar.set(filename);
  }

  canDeactivate() {
    if (this.saved || this.registerForm.pristine) {
      return true;
    }
    const modalRef = this.modal.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Changes not saved';
    modalRef.componentInstance.body = 'Do you want to leave the page?';
    return modalRef.result.catch(() => false);
  }
}
