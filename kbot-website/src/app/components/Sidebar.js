'use client';

import Image from 'next/image';
import { signIn, signOut } from 'next-auth/react';
import { FiX } from 'react-icons/fi'; // React Icons

export default function Sidebar({
  activeSection,
  setActiveSection,
  session,
  sidebarOpen,
  setSidebarOpen,
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-gray-900 p-6 flex flex-col z-50 transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:relative md:flex`}
    >
      {/* Close Button (Mobile Only) */}
      <button
        className="absolute top-4 right-4 md:hidden text-white"
        onClick={() => setSidebarOpen(false)}
      >
        <FiX size={24} />
      </button>

      {/* Logo with Extra Bottom Margin */}
      <div className="flex justify-center mb-8 mt-2">
        <Image src="/kbot-logo.png" alt="KsyncBot Logo" width={80} height={80} />
      </div>

      {/* Navigation with Extra Top Margin */}
      <nav className="flex-grow flex flex-col space-y-3">
        {['home', 'commands', 'emotechecker', 'docs', 'chatbot'].map(section => (
          <button
            key={section}
            onClick={() => {
              setActiveSection(section);
              setSidebarOpen(false); // Close sidebar on mobile when clicking a section
            }}
            className={`py-2 px-4 text-left rounded-lg transition-all ${
              activeSection === section ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </nav>

      {/* Login Button (Always Visible on Mobile) */}
      <div className="mt-auto sticky bottom-6">
        {session ? (
          <button onClick={() => signOut()} className="w-full p-2 bg-red-500 rounded-lg">
            Logout ({session.user.name})
          </button>
        ) : (
          <button
            onClick={() => signIn('twitch')}
            className="w-full p-2 bg-[#9146FF] rounded-lg text-white"
          >
            Login with Twitch
          </button>
        )}
      </div>
    </aside>
  );
}
