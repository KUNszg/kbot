'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
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
  const pathname = usePathname();
  const [sideProjectsOpen, setSideProjectsOpen] = useState(false);

  const mainSections = ['home', 'commands', 'emotechecker', 'docs', 'privacy'];

  const sideProjects = [
    { id: 'side-projects/niedziele-handlowe', label: 'Niedziele Handlowe' }
  ];

  const handleSectionClick = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

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
        <div onClick={() => handleSectionClick('home')} className="cursor-pointer">
          <Image src="/kbot-logo.png" alt="KsyncBot Logo" width={80} height={80} />
        </div>
      </div>

      <nav className="flex-grow flex flex-col space-y-3 overflow-y-auto">
        {/* Main sections */}
        {mainSections.map(section => (
          <button
            key={section}
            onClick={() => handleSectionClick(section)}
            className={`py-2 px-4 text-left rounded-lg transition-all ${
              activeSection === section ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            {section === 'privacy'
              ? 'Privacy Policy'
              : section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}

        {/* Side Projects Dropdown */}
        <div className="pt-2">
          <button
            onClick={() => setSideProjectsOpen(!sideProjectsOpen)}
            className="w-full py-2 px-4 text-left rounded-lg transition-all hover:bg-gray-700 flex items-center justify-between"
          >
            <span>Side Projects</span>
            {sideProjectsOpen ? (
              <FiChevronDown className="w-4 h-4" />
            ) : (
              <FiChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Dropdown content */}
          {sideProjectsOpen && (
            <div className="ml-4 mt-2 space-y-2">
              {sideProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleSectionClick(project.id)}
                  className={`w-full py-2 px-4 text-left rounded-lg transition-all text-sm ${
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

        {session && (
          <button
            onClick={() => {
              window.location.href = '/account';
            }}
            className={`py-2 px-4 text-left rounded-lg transition-all ${
              pathname === '/account' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            Account
          </button>
        )}
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
