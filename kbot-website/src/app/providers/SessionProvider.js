'use client';

import { SessionProvider as NextAuthProvider } from 'next-auth/react';

export default function SessionProvider({ children }) {
  return <NextAuthProvider>{children}</NextAuthProvider>;
}
