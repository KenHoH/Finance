import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
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

function sanitize(obj: unknown): unknown {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map((item) => sanitize(item));
  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, unknown>)[key];
      sanitized[key] = sanitize(val);
    }
    return sanitized;
  }
  return obj;
}

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (request.body) {
      const body = request.body as Record<string, unknown>;
      const s = sanitize(body);
      Object.keys(body).forEach((k) => delete body[k]);
      Object.assign(body, s);
    }
    if (request.query) {
      const query = request.query as Record<string, unknown>;
      const s = sanitize(query);
      Object.keys(query).forEach((k) => delete query[k]);
      Object.assign(query, s);
    }
    if (request.params) {
      const params = request.params as Record<string, unknown>;
      const s = sanitize(params);
      Object.keys(params).forEach((k) => delete params[k]);
      Object.assign(params, s);
    }
    return next.handle();
  }
}
