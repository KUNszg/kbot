'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SessionProvider from '@/app/providers/SessionProvider';
import SharedLayout from '@/app/components/SharedLayout';

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl font-bold mb-4">Account Settings</h1>
            <p className="text-gray-400">Manage your KsyncBot account and preferences</p>
          </div>

          <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold text-[#9146FF] mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user?.name || 'User'}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <p className="text-lg font-medium">{session.user?.name}</p>
                  <p className="text-gray-400">{session.user?.email}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold text-[#9146FF] mb-4">Connected Services</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#9146FF] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                    </svg>
                  </div>
                  <span className="font-medium">Twitch</span>
                </div>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
            </div>
          </section>

          <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold text-[#9146FF] mb-4">Bot Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Bot Commands</p>
                  <p className="text-sm text-gray-400">
                    Enable or disable bot commands in your channel
                  </p>
                </div>
                <button className="bg-[#9146FF] hover:bg-[#7c3aed] px-4 py-2 rounded-lg transition-colors">
                  Enabled
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Opt-out Options</p>
                  <p className="text-sm text-gray-400">
                    Manage commands you want to opt-out from
                  </p>
                </div>
                <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
                  Manage
                </button>
              </div>
            </div>
          </section>

          <section className="bg-gray-800 p-6 rounded-lg border border-red-900/50">
            <h2 className="text-2xl font-semibold text-red-500 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-gray-400">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <SessionProvider>
      <SharedLayout>
        <AccountContent />
      </SharedLayout>
    </SessionProvider>
  );
}
