import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

const DANGEROUS_PROTOCOLS = /^\s*(javascript|vbscript|data)\s*:/i;
const HTML_TAGS = /<\/?[^>]+(>|$)/g;
const EVENT_HANDLERS = /\bon\w+\s*=/gi;
const HTML_ENTITIES_SCRIPT = /&#x?[0-9a-f]+;?/gi;
const NULL_BYTES = /\0/g;

function sanitizeString(value: string): string {
  let cleaned = value;
  cleaned = cleaned.replace(NULL_BYTES, '');
  cleaned = cleaned.replace(HTML_TAGS, '');
  cleaned = cleaned.replace(EVENT_HANDLERS, '');
  cleaned = cleaned.replace(DANGEROUS_PROTOCOLS, '');
  cleaned = cleaned.replace(HTML_ENTITIES_SCRIPT, '');
  return cleaned.trim();
}

function sanitize(obj: any): any {
  if(typeof obj === 'string') return sanitizeString(obj);
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
      const s = sanitize(request.body);
      Object.keys(request.body).forEach((k) => delete (request.body as any)[k]);
      Object.assign(request.body, s);
    }
    if(request.query){
      const s = sanitize(request.query);
      Object.keys(request.query).forEach((k) => delete (request.query as any)[k]);
      Object.assign(request.query as any, s);
    }
    if(request.params){
      const s = sanitize(request.params);
      Object.keys(request.params).forEach((k) => delete (request.params as any)[k]);
      Object.assign(request.params as any, s);
    }
    return next.handle();
  }
}
