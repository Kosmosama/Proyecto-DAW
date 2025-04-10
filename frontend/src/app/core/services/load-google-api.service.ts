import { Injectable, inject } from '@angular/core';
import { Subject, fromEvent, firstValueFrom } from 'rxjs';
import { CLIENT_ID } from '../../auth/google-login.config';

@Injectable({
  providedIn: 'root',
})
export class LoadGoogleApiService {
  #loader: Promise<void>;
  #credential$ = new Subject<google.accounts.id.CredentialResponse>();
  #clientId = inject(CLIENT_ID, { optional: true });

  constructor() {
    if (this.#clientId === null) {
      // Error al desarrollador cuando no ha inyectado la id de Google
      throw new Error(
        'LoadGoogleApiService: You must call provideGoogleId in your providers array'
      );
    }
    this.#loader = this.#loadApi(); // Empezamos a cargar la librería
  }

  get credential$() {
    return this.#credential$.asObservable();
  }

  async setGoogleBtn(btn: HTMLElement) {
    await this.#loader; 
    google.accounts.id.renderButton(
      btn,
      { theme: 'outline', size: 'large', type: 'standard', shape: 'pill', width: 120 }
    );
  }

  async #loadApi(): Promise<void> {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.body.appendChild(script);

    await firstValueFrom(fromEvent(script, 'load'));

    google.accounts.id.initialize({
      client_id: this.#clientId!,
      callback: (response) => {
        this.#credential$.next(response);
      },
    });
  }
}