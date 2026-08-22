'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FiX, FiChevronDown, FiChevronRight, FiLogOut, FiUser } from 'react-icons/fi';
import { Session } from 'next-auth';
import { useState } from 'react';

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
  const router = useRouter();
  const { status } = useSession();
  const [sideProjectsOpen, setSideProjectsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const mainSections = ['home', 'commands', 'emotechecker', 'docs', 'privacy'];

  const sideProjects = [
    { id: 'side-projects/niedziele-handlowe', label: 'Niedziele Handlowe' }
  ];

  const handleSectionClick = (section: string) => {
    const targetPath = section === 'home' ? '/' : `/${section}`;
    router.push(targetPath);
    setSidebarOpen(false);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await signIn('twitch', { callbackUrl: '/account' });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-gray-900 p-6 flex flex-col z-50 transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:relative md:flex border-r border-gray-800`}
    >
      <button
        type="button"
        className="absolute top-4 right-4 md:hidden text-white cursor-pointer"
        onClick={() => setSidebarOpen(false)}
      >
        <FiX size={24} />
      </button>

      <div className="flex justify-center mb-8 mt-2">
        <div onClick={() => handleSectionClick('home')} className="cursor-pointer">
          <Image src="/kbot-logo.png" alt="KsyncBot Logo" width={80} height={80} />
        </div>
      </div>

      <nav className="flex-grow flex flex-col space-y-3 overflow-y-auto">
        {mainSections.map(section => (
          <button
            key={section}
            type="button"
            onClick={() => handleSectionClick(section)}
            className={`py-2 px-4 text-left rounded-lg transition-all cursor-pointer ${
              activeSection === section ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            {section === 'privacy'
              ? 'Privacy Policy'
              : section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setSideProjectsOpen(!sideProjectsOpen)}
            className="w-full py-2 px-4 text-left rounded-lg transition-all hover:bg-gray-700 flex items-center justify-between cursor-pointer"
          >
            <span>Side Projects</span>
            {sideProjectsOpen ? (
              <FiChevronDown className="w-4 h-4" />
            ) : (
              <FiChevronRight className="w-4 h-4" />
            )}
          </button>

          {sideProjectsOpen && (
            <div className="ml-4 mt-2 space-y-2">
              {sideProjects.map(project => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSectionClick(project.id)}
                  className={`w-full py-2 px-4 text-left rounded-lg transition-all text-sm cursor-pointer ${
                    activeSection === project.id
                      ? 'bg-purple-600'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {project.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="mt-auto sticky bottom-6 pt-4 border-t border-gray-800">
        {status === 'loading' ? (
          <div className="w-full h-10" />
        ) : session ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                router.push('/account');
                setSidebarOpen(false);
              }}
              className={`flex-grow flex items-center justify-center gap-2 p-2 rounded-lg text-white cursor-pointer transition-colors ${
                window.location.pathname === '/account'
                  ? 'bg-blue-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <FiUser />
              <span className="truncate max-w-[100px] text-sm">{session.user.name}</span>
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg cursor-pointer transition-all"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full p-2 rounded-lg text-white transition-colors font-medium ${
              isLoggingIn
                ? 'bg-[#772ce8] cursor-wait opacity-80'
                : 'bg-[#9146FF] hover:bg-[#772ce8] cursor-pointer'
            }`}
          >
            {isLoggingIn ? 'Redirecting...' : 'Login with Twitch'}
          </button>
        )}
      </div>
    </aside>
  );
}
