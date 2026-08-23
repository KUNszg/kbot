'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';

interface SharedLayoutProps {
  children: React.ReactNode;
}

export default function SharedLayout({ children }: SharedLayoutProps) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen relative">
      <button
        className="absolute top-4 left-4 md:hidden z-50 p-2 bg-gray-800 text-white rounded"
        onClick={() => setSidebarOpen(true)}
      >
        <FiMenu size={24} />
      </button>

      <Sidebar
        activeSection=""
        setActiveSection={() => {}}
        session={session}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <main className="flex-1 bg-gray-800 overflow-auto text-white">{children}</main>
    </div>
  );
}
