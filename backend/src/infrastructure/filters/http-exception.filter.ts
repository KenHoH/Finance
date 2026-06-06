import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        const msg = obj.message;
        if (typeof msg === 'string' || Array.isArray(msg)) {
          message = msg;
        }
        const err = obj.error;
        if (typeof err === 'string') {
          error = err;
        }
      } else {
        message = String(res);
      }
    } else if (this.isPrismaError(exception)) {
      const code = (exception as Record<string, unknown>).code as string;
      const meta = (exception as Record<string, unknown>).meta as
        | Record<string, unknown>
        | undefined;
      const target = meta?.target as string[] | undefined;
      switch (code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Duplicate value on field: ${target?.join(', ') || 'unknown'}`;
          error = 'Conflict';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          error = 'Not Found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed';
          error = 'Bad Request';
          break;
        default:
          message = 'Database error';
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as Record<string, unknown>).code === 'string' &&
      String((exception as Record<string, unknown>).code).startsWith('P')
    );
  }
}
