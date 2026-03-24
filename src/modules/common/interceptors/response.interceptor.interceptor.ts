

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
     const res = ctx.getResponse();


    return next.handle().pipe(
      map((data) => ({
        ok: true,
        message: 'OK',
        data,
        errors: null,
        meta: {
          path: (req as any).originalUrl,
          method: (req as any).method,
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode
        },
      })),
    );
  }
}
