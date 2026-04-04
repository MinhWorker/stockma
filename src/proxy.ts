import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_COOKIES = [
  '__Secure-better-auth.session_token',
  'better-auth.session_token',
];

const PUBLIC_PATHS = ['/login'];

function isPublicPath(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(vi|en)/, '') || '/';
  return PUBLIC_PATHS.some((p) => stripped === p || stripped.startsWith(p + '/'));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico' ||
    /\.\w+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);

  if (isPublicPath(pathname)) return intlResponse;

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!hasSession) {
    const segments = pathname.split('/');
    const locale = routing.locales.includes(segments[1] as 'vi' | 'en')
      ? segments[1]
      : routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ['/', '/(vi|en)/:path*'],
};
