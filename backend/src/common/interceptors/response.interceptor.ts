import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((response) => {
                // If it's an object and has a "data" key, extract other keys into "meta"
                if (response && typeof response === 'object' && 'data' in response) {
                    const { data, ...rest } = response;
                    return Object.keys(rest).length > 0
                        ? { data, meta: rest }
                        : { data };
                }

                // If it doesn't have "data" key, just wraps it under "data"
                return { data: response };
            }),
        );
    }
}
