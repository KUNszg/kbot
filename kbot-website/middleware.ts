import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

// Next.js Server Reference IDs are always exactly 42 hex chars (SERVER_REFERENCE_ID_LENGTH).
// Bots scanning for the Server Actions RCE pattern send garbage values here ("x", "0", "1", ...),
// which Next.js otherwise logs as a full uncaught-looking error for every request.
const SERVER_ACTION_ID_PATTERN = /^[0-9a-f]{42}$/i;

const AUTH_PROTECTED_PATTERN = /^\/(account|api\/(account|connected-apps))(\/|$)/;

// `auth` also accepts (request, event) directly for the "bare" middleware mode used by
// `export default auth` (next-auth/lib/index.js, the `args[0] instanceof Request` branch) -
// this overload isn't exposed in next-auth's public types, hence the cast.
const authMiddleware = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent
) => Promise<Response>;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const actionId = request.headers.get('next-action');
  if (actionId && !SERVER_ACTION_ID_PATTERN.test(actionId)) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  if (AUTH_PROTECTED_PATTERN.test(request.nextUrl.pathname)) {
    return authMiddleware(request, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
