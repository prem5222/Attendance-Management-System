import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Firebase Auth state is managed client-side
  // Route protection is handled by ProtectedRoute and AdminRoute components
  // This middleware can be used for additional server-side checks if needed
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
