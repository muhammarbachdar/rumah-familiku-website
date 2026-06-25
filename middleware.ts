// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['id', 'en'],
  defaultLocale: 'id',
});

const SESSION_COOKIE_NAME = 'rumah-familiku-admin-session';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Semua path /admin/* (termasuk /admin sendiri) di luar locale system
  if (pathname.startsWith('/admin')) {
    // Proteksi khusus untuk /admin/dashboard
    if (pathname.startsWith('/admin/dashboard')) {
      const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
      if (!sessionCookie?.value) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
    // /admin (login) dan /admin/dashboard (dengan cookie valid) lanjut tanpa intl
    return NextResponse.next();
  }

  // Untuk halaman publik, jalankan next-intl middleware seperti biasa
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};