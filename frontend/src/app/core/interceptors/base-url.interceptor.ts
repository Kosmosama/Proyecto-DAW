import { HttpInterceptorFn } from '@angular/common/http';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const serverUrl = 'http://localhost:3000';
  const reqClone = req.clone({
    url: `${serverUrl}/${req.url}`,
  });
  return next(reqClone);
};