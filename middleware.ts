import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { nextUrl, method } = request;
  const { pathname } = nextUrl;

  const isAssetRequest = /\.[^/]+$/.test(pathname);
  const isIconRequest = pathname === '/favicon.ico' || pathname.startsWith('/icon');
  const isNextInternal = pathname.startsWith('/_next');

  if (method !== 'GET' || pathname === '/' || isAssetRequest || isIconRequest || isNextInternal) {
    return NextResponse.next();
  }

  const acceptHeader = request.headers.get('accept') ?? '';
  if (!acceptHeader.includes('text/html')) {
    return NextResponse.next();
  }

  const rewriteUrl = new URL('/', request.url);
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ['/:path*']
};
