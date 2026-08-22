'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';
import StatsBox from './StatsBox';

interface SharedLayoutProps {
  children: React.ReactNode;
  showStats?: boolean;
}

export default function SharedLayout({ children, showStats = false }: SharedLayoutProps) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats] = useState({ users: 0, messages: 0, uptime: '0h 0m' });

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

      {showStats && <StatsBox stats={stats} />}

      <main className="flex-1 bg-gray-800 overflow-auto text-white">{children}</main>
    </div>
  );
}
