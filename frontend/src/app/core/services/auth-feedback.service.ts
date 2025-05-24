import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthFeedbackService {
    private loginRequiredSubject = new Subject<void>();
    loginRequired$ = this.loginRequiredSubject.asObservable();

    notifyLoginRequired() {
        this.loginRequiredSubject.next();
    }
}
