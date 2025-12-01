import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();


    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resBody = exception.getResponse();
      const payload = typeof resBody === 'string' ? { message: resBody } : resBody;
      return response.status(status).json({
        ...(payload as object),
        statusCode: status,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }


    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorCode = exception?.code || 'INTERNAL_SERVER_ERROR';
    const message = exception?.message || 'Unexpected error';


    const includeStack = process.env.NODE_ENV !== 'production';

    return response.status(status).json({
      statusCode: status,
      error: errorCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(includeStack && exception?.stack ? { stack: exception.stack } : {}),
    });
  }
}
