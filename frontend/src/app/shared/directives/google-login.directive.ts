import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, Directive, ElementRef, inject, output, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadGoogleApiService } from '../../core/services/load-google-api.service';

@Directive({
  standalone: true,
  selector: 'google-login',
})
export class GoogleLoginDirective {
  #element = inject(ElementRef);
  platformId = inject(PLATFORM_ID);
  #loadService = isPlatformBrowser(this.platformId) ? inject(LoadGoogleApiService) : null;
  login = output<google.accounts.id.CredentialResponse>();

  constructor() {
    afterNextRender(() =>
      this.#loadService?.setGoogleBtn(this.#element.nativeElement)
    );
    this.#loadService?.credential$
      .pipe(takeUntilDestroyed())
      .subscribe((resp) => this.login.emit(resp));
  }
}