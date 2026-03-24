import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        const timestamp = new Date().toISOString();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';
        let errors: any[] = [];

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const response = exception.getResponse();

            
            if (typeof response === 'string') {
                message = response;
            } else if (typeof response === 'object' && response) {
                const r: any = response;

                if (Array.isArray(r.message)) {
                    message = 'Validación fallida';
                    errors = r.message.map((m: string) => ({ message: m }));
                } else if (typeof r.message === 'string') {
                    message = r.message;
                }

                if (r.code) {
                    errors = [{ code: r.code, message: r.message ?? message }];
                }
            }
        } else {

            const e: any = exception;
            if (e?.message) message = e.message;
            errors = [{ message }];
        }

        res.status(status).json({
            ok: false,
            message,
            data: null,
            errors: errors.length ? errors : [{ message }],
            meta: {
                path: req.originalUrl,
                method: req.method,
                statusCode: status,
                timestamp,
            },
        });
    }
}
