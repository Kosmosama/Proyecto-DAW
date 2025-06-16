import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const serverUrl = environment.apiUrl;
  const reqClone = req.clone({
    url: `${serverUrl}/${req.url}`,
    // url: `http://localhost:3000/${req.url}`,
  });
  return next(reqClone);
};