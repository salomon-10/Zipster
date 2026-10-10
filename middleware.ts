import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/auth/session';

const PROTECTED = ['/dashboard', '/settings', '/admin'];
const AUTH_ONLY = ['/login', '/register'];

/**
 * First line of defence: keeps signed-out visitors out of the app shell and
 * signed-in users off the auth screens. Pages and server actions re-check the
 * session on the server, so this is a redirect convenience, not the guard.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isProtected = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthScreen = AUTH_ONLY.some((path) => pathname === path);

  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isProtected && pathname.startsWith('/admin') && session?.role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isAuthScreen && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/admin/:path*', '/login', '/register'],
};
