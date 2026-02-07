import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/account/:path*', '/api/account/:path*', '/api/connected-apps/:path*']
};
