
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();


    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const payload = this.mapPrismaKnownError(exception);
      return res.status(payload.status).json(payload.body);
    }


    if (
      exception instanceof Prisma.PrismaClientValidationError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'PRISMA_ERROR',
        message: exception.message,
      });
    }


    if (exception?.code && typeof exception.code === 'string') {
      const payload = this.mapEthersError(exception);
      return res.status(payload.status).json(payload.body);
    }


    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      return res.status(status).json(
        typeof resp === 'string' ? { error: 'HTTP_ERROR', message: resp } : resp,
      );
    }


    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong. Please try again.',
    });
  }

  private mapPrismaKnownError(e: Prisma.PrismaClientKnownRequestError) {

    switch (e.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          body: { error: 'DUPLICATE', message: 'Record already exists.' },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: { error: 'NOT_FOUND', message: 'Requested record not found.' },
        };
      case 'P2022':
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            error: 'SCHEMA_MISMATCH',
            message:
              'Database schema is out of sync (column/table missing). Contact admin.',
            meta: { code: e.code, field: (e.meta as any)?.column },
          },
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          body: { error: e.code, message: e.message },
        };
    }
  }

  private mapEthersError(e: any) {
    const code = e.code as string;


    const rawMsg =
      e.reason ||
      e.shortMessage ||
      e.info?.error?.message ||
      e.message ||
      'Blockchain error';

    const base = { error: code, message: rawMsg };

    switch (code) {
      case 'INSUFFICIENT_FUNDS':
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            ...base,
            hint:
              'Fund the deployer/signer with test ETH to cover gas, or lower gas settings.',
          },
        };
      case 'INVALID_ARGUMENT':
      case 'UNSUPPORTED_OPERATION':
      case 'CALL_EXCEPTION':
      case 'UNPREDICTABLE_GAS_LIMIT':
        return { status: HttpStatus.BAD_REQUEST, body: base };
      case 'ACTION_REJECTED':
        return { status: HttpStatus.FORBIDDEN, body: base };
      case 'NETWORK_ERROR':
        return {
          status: HttpStatus.BAD_GATEWAY,
          body: { ...base, hint: 'RPC unavailable. Check RPC URL / network.' },
        };
      default:
        return { status: HttpStatus.BAD_REQUEST, body: base };
    }
  }
}
