import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    if(['GET', 'HEAD', 'OPTIONS'].includes(method)){
      return true;
    }

    // Allow logout to execute so it can clear cookies even with stale token
    if(request.path === '/auth/logout'){
      return true;
    }

    // Skip CSRF for API requests with Bearer token (JWT auth)
    const authHeader = request.headers.authorization;
    if(authHeader?.startsWith('Bearer ')){
      return true;
    }

    const cookieToken = request.cookies?.['csrf-token'];
    const headerToken = request.headers['x-csrf-token'];

    if(!cookieToken || !headerToken || cookieToken !== headerToken){
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    return true;
  }
}
