import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HttpStatusService {
  constructor(private http: HttpClient) {}

  getData(url: string): Observable<any> {
    return this.http.get(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return of(error); 
      })
    );
  }
}
