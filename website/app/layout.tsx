import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';

import './styles.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KsyncBot',
  description: 'KsyncBot - utility bot for Twitch chat',
  icons: {
    icon: '../favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
