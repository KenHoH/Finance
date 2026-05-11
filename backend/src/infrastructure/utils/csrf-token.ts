import { randomBytes } from 'crypto';
import type { CookieOptions, Response } from 'express';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

function cookieSameSite(): CookieOptions['sameSite'] {
  const configured = process.env.COOKIE_SAMESITE?.toLowerCase();
  if (configured === 'strict' || configured === 'lax' || configured === 'none') {
    return configured;
  }
  return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
}

export function authCookieOptions(httpOnly: boolean): CookieOptions {
  const options: CookieOptions = {
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite: cookieSameSite(),
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
}

export function setCsrfCookie(res: Response, token: string){
  res.cookie('csrf-token', token, {
    ...authCookieOptions(false),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
