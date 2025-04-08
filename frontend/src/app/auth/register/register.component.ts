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
import { CatModalComponent } from '../../shared/components/modals/cat-modal/cat-modal.component'; // Importa CatModalComponent
import { EncodeBase64Directive } from '../../shared/directives/encode-base64.directive';
import { ValidationClassesDirective } from '../../shared/directives/validation-classes.directive';
import { matchEmail } from '../../shared/validators/match-email.validator';
import { Player } from '../../core/interfaces/player.interface';

@Component({
  standalone: true,
  selector: 'register',
  imports: [
    FormsModule,
    EncodeBase64Directive,
    ReactiveFormsModule,
    ValidationClassesDirective,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements CanComponentDeactivate {
  #fb = inject(NonNullableFormBuilder);
  #authService = inject(AuthService);
  #destroyRef = inject(DestroyRef);
  #router = inject(Router);
  #modal = inject(NgbModal);
  #saved = false;
  imageBase64 = '';

  errors = signal<number>(0);

  registerForm = this.#fb.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      email2: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      avatar: [''],
    },
    { validators: matchEmail('email', 'email2') }
  );

  constructor() { }

  addPlayer() {
    const rawValue = this.registerForm.getRawValue();
  
    const player: Player = {
      username: rawValue.name,
      email: rawValue.email,
      password: rawValue.password,
      photo: this.imageBase64 || ''
    };
  
    this.#authService
      .register(player)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.#saved = true;
          const modalRef = this.#modal.open(CatModalComponent);
          modalRef.componentInstance.message = 'Registration successful!';
          modalRef.componentInstance.catImageUrl = 'https://http.cat/200';
  
          modalRef.result.then(
            () => this.#router.navigate(['auth/login']),
          );
        },
        error: (error) => {
          this.errors.set(error.status);
          window.scrollTo(0, 0);
          const modalRef = this.#modal.open(CatModalComponent);
          modalRef.componentInstance.message = `Error ${error.status}: ${error.message}`;
          modalRef.componentInstance.catImageUrl = `https://http.cat/${error.status}`;
        }
      });
  }
  handleAvatarChange(base64Image: string) {
    this.imageBase64 = base64Image;
    const img = document.getElementById('imgPreview') as HTMLImageElement;
    if (img) {
      img.src = base64Image;
      img.classList.remove('d-none');
    }
  }

  canDeactivate() {
    if (this.#saved || this.registerForm.pristine) {
      return true;
    }
    const modalRef = this.#modal.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Changes not saved';
    modalRef.componentInstance.body = 'Do you want to leave the page?';
    return modalRef.result.catch(() => false);
  }
}
