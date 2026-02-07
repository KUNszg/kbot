'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FiMenu } from 'react-icons/fi';
import { useParams } from 'next/navigation';

import SessionProvider from '../providers/SessionProvider';
import Sidebar from '../components/Sidebar';
import StatsBox from '../components/StatsBox';
import HomeSection from '../components/HomeSection';
import CommandsSection from '../components/CommandsSection';
import EmoteCheckerSection from '../components/EmoteCheckerSection';
import DocsSection from '../components/DocsSection';
import NiedzieleHandloweSection from '../components/TradingSundaysSection';
import PrivacySection from '../components/PrivacySection';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  );
}

function HomeContent() {
  const { data: session } = useSession();
  const params = useParams();

  const [stats] = useState({ users: 0, messages: 0, uptime: '0h 0m' });
  const [botName, setBotName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeSection = params?.slug
    ? Array.isArray(params.slug)
      ? params.slug.join('/')
      : params.slug
    : 'home';

  useEffect(() => {
    const name = 'KsyncBot';
    let i = 0;
    const interval = setInterval(() => {
      setBotName(name.slice(0, i + 1));
      i++;
      if (i === name.length) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen relative">
      <button
        className="absolute top-4 left-4 md:hidden z-50 p-2 bg-gray-800 text-white rounded cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => setSidebarOpen(true)}
      >
        <FiMenu size={24} />
      </button>

      <Sidebar
        activeSection={activeSection}
        setActiveSection={() => {}}
        session={session}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {!activeSection.startsWith('side-projects/') && <StatsBox stats={stats} />}

      <main className="flex-1 p-6 md:p-8 bg-gray-800 overflow-auto text-white">
        {activeSection === 'home' && (
          <HomeSection
            botName={
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
              >
                {botName.split('').map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.span>
            }
          />
        )}
        {activeSection === 'commands' && <CommandsSection />}
        {activeSection === 'emotechecker' && <EmoteCheckerSection />}
        {activeSection === 'docs' && <DocsSection />}
        {activeSection === 'privacy' && <PrivacySection />}
        {activeSection === 'side-projects/niedziele-handlowe' && <NiedzieleHandloweSection />}
      </main>
    </div>
  );
}
