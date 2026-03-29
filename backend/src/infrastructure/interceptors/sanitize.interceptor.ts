import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

function sanitize(obj: any): any {
  if(typeof obj === 'string') return stripTags(obj);
  if(Array.isArray(obj)) return obj.map(sanitize);
  if(obj && typeof obj === 'object'){
    const sanitized: any = {};
    for(const key of Object.keys(obj)){
      sanitized[key] = sanitize(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if(request.body){
      request.body = sanitize(request.body);
    }
    return next.handle();
  }
}
