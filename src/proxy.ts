import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const isPublicRoute = (pathname: string): boolean => {
  // Exact matches
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return true;
  }
  // Prefix matches for public paths
  const publicPrefixes = [
    '/quiz/',
    '/quiz',
    '/results/',
    '/results',
    '/api/auth/',
    '/api/quizzes/join',
    '/api/results/',
  ];
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
};

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Protect /teacher/* routes (require login + role = 'teacher')
  if (pathname.startsWith('/teacher')) {
    if (!isLoggedIn || role !== 'teacher') {
      const loginUrl = new URL('/login', nextUrl);
      loginUrl.searchParams.set('callbackUrl', nextUrl.href);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Protect all other non-public routes (require login)
  if (!isPublicRoute(pathname) && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
