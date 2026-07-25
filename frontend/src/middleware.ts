import { NextResponse } from 'next/server';

import { parseJwt } from '@/shared/lib/utils';

import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/api/health'];
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password'];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path.startsWith(p));
}

function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath(pathname) && token) {
    try {
      parseJwt(token);
      return NextResponse.redirect(new URL('/', request.url));
    } catch {
      // Invalid token, allow to proceed to auth page
    }
  }

  // Protect app routes
  if (!token && !isPublicPath(pathname)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token validity
  if (token) {
    try {
      parseJwt(token);
    } catch {
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};