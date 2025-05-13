'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FiMenu } from 'react-icons/fi'; // React Icons
import SessionProvider from './providers/SessionProvider';
import Sidebar from './components/Sidebar';
import StatsBox from './components/StatsBox';
import HomeSection from './components/HomeSection';
import CommandsSection from './components/CommandsSection';
import EmoteCheckerSection from './components/EmoteCheckerSection';
import DocsSection from './components/DocsSection';

export default function Home() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  );
}

function HomeContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ users: 0, messages: 0, uptime: '0h 0m' });
  const [activeSection, setActiveSection] = useState('home');
  const [botName, setBotName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeSection === 'home' || activeSection === 'chatbot') {
      const socket = new WebSocket('wss://your-backend-websocket-url');
      socket.onmessage = event => {
        const data = JSON.parse(event.data);
        setStats(prevStats => ({ ...prevStats, ...data.stats }));
      };
      return () => socket.close();
    }
  }, [activeSection]);

  useEffect(() => {
    const name = 'KsyncBot';
    let i = 0;
    const interval = setInterval(() => {
      setBotName(name.slice(0, i + 1));
      i++;
      if (i === name.length) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [activeSection]);

  return (
    <div className="flex min-h-screen relative">
      {/* Mobile Menu Button */}
      <button
        className="absolute top-4 left-4 md:hidden z-50 p-2 bg-gray-800 text-white rounded"
        onClick={() => setSidebarOpen(true)}
      >
        <FiMenu size={24} />
      </button>

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        session={session}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Overlay when Sidebar is Open on Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Stats Bubble & Desktop Stats Box */}
      <StatsBox stats={stats} />

      {/* Main Content Section */}
      <main className="flex-1 p-6 md:p-8 bg-gray-800 overflow-auto">
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
      </main>
    </div>
  );
}
