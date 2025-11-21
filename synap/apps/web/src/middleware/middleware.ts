import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/config';

export function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
