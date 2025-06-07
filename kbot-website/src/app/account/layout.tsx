import SessionProvider from '../providers/SessionProvider';
import React from 'react';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
