import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/', '/api/auth/google', '/api/auth/csrf', '/api/email'];
const PROTECTED_API_PREFIX = '/api/';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('token');
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  const isApiRoute = pathname.startsWith(PROTECTED_API_PREFIX);

  // API routes without auth token get 401
  if(isApiRoute && !isPublic && !authToken){
    return NextResponse.json(
      { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Page routes without auth token redirect to login
  if(!isPublic && !authToken){
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
