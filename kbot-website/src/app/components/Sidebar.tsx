'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { FiX } from 'react-icons/fi';
import { Session } from 'next-auth';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  session: Session | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  session,
  sidebarOpen,
  setSidebarOpen
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-gray-900 p-6 flex flex-col z-50 transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:relative md:flex`}
    >
      <button
        className="absolute top-4 right-4 md:hidden text-white"
        onClick={() => setSidebarOpen(false)}
      >
        <FiX size={24} />
      </button>

      <div className="flex justify-center mb-8 mt-2">
        <Link href="/" onClick={() => setSidebarOpen(false)}>
          <Image src="/kbot-logo.png" alt="KsyncBot Logo" width={80} height={80} />
        </Link>
      </div>

      <nav className="flex-grow flex flex-col space-y-3">
        {pathname === '/' ? (
          <>
            {['home', 'commands', 'emotechecker', 'docs'].map(section => (
              <button
                key={section}
                onClick={() => {
                  setActiveSection(section);
                  setSidebarOpen(false);
                }}
                className={`py-2 px-4 text-left rounded-lg transition-all ${
                  activeSection === section ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </>
        ) : (
          <>
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className="py-2 px-4 text-left rounded-lg transition-all hover:bg-gray-700"
            >
              Home
            </Link>
            {['commands', 'emotechecker', 'docs'].map(section => (
              <Link
                key={section}
                href={`/?section=${section}`}
                onClick={() => setSidebarOpen(false)}
                className="py-2 px-4 text-left rounded-lg transition-all hover:bg-gray-700"
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </Link>
            ))}
          </>
        )}

        {session && (
          <Link
            href="/account"
            onClick={() => setSidebarOpen(false)}
            className={`py-2 px-4 text-left rounded-lg transition-all ${
              pathname === '/account' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            Account
          </Link>
        )}

        <div className="pt-3 border-t border-gray-700">
          <Link
            href="/privacy"
            onClick={() => setSidebarOpen(false)}
            className={`py-2 px-4 text-left rounded-lg transition-all block ${
              pathname === '/privacy' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            Privacy Policy
          </Link>
        </div>
      </nav>

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
