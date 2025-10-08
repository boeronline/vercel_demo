import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.method === 'HEAD') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/icon') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
};
