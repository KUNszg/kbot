'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiLogOut,
  FiShield,
  FiTrash2,
  FiMusic,
  FiExternalLink,
  FiLink
} from 'react-icons/fi';
import SessionProvider from '../providers/SessionProvider';
import SharedLayout from '../components/SharedLayout';

export const dynamic = 'force-dynamic';

interface ConnectedApp {
  id: number;
  app_name: string;
  app_type: 'spotify' | 'discord';
  permissions: string[];
  connected_at: string;
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

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    fetchConnectedApps();
  }, [session, status, router]);

  const fetchConnectedApps = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/connected-apps');
      if (response.ok) {
        const data = await response.json();
        setConnectedApps(data.connectedApps || []);
      } else {
        console.error('Failed to fetch connected apps');
      }
    } catch (error) {
      console.error('Error fetching connected apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectSpotify = async () => {
    setConnecting('spotify');
    try {
      window.location.href = '/api/spotify/connect';
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      setConnecting(null);
    }
  };

  const disconnectApp = async (appType: string) => {
    if (confirm(`Are you sure you want to disconnect ${appType}?`)) {
      try {
        const response = await fetch('/api/connected-apps', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ appType })
        });

        if (response.ok) {
          setConnectedApps(connectedApps.filter(app => app.app_type !== appType));
        } else {
          console.error('Failed to disconnect app');
        }
      } catch (error) {
        console.error('Error disconnecting app:', error);
      }
    }
  };

  const getAppIcon = (appType: string) => {
    switch (appType) {
      case 'spotify':
        return <FiMusic className="w-6 h-6 text-green-500" />;
      case 'discord':
        return <div className="w-6 h-6 text-blue-500">🎮</div>;
      default:
        return <FiExternalLink className="w-6 h-6 text-gray-400" />;
    }
  };

  const getAppColor = (appType: string) => {
    switch (appType) {
      case 'spotify':
        return 'border-green-500/30 bg-green-500/5';
      case 'discord':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const isSpotifyConnected = connectedApps.some(app => app.app_type === 'spotify');

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your account and connected applications</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>

              <div className="flex flex-col items-center mb-6">
                {session.user?.image && !imageError ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={100}
                    height={100}
                    className="rounded-full mb-4"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-[100px] h-[100px] bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <FiUser className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <h3 className="text-lg font-medium text-white">{session.user?.name}</h3>
                <p className="text-gray-400 text-sm">Twitch Account</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <FiUser className="mr-3" />
                  <span>Username: {session.user?.name}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <FiMail className="mr-3" />
                  <span>Email: {session.user?.email || 'Not available'}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <FiCalendar className="mr-3" />
                  <span>Member since: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <FiLogOut className="mr-2" />
                Sign Out
              </button>
            </div>
          </motion.div>

          {/* Connected Apps Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Connected Applications</h2>
              </div>

              {connectedApps.length === 0 ? (
                <div className="text-center py-8">
                  <FiLink className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No applications connected yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectedApps.map(app => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border rounded-lg p-4 ${getAppColor(app.app_type)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {getAppIcon(app.app_type)}
                            <h3 className="text-lg font-medium text-white ml-3">
                              {app.app_name}
                            </h3>
                          </div>

                          <p className="text-gray-500 text-xs mb-3">
                            Connected on {new Date(app.connected_at).toLocaleDateString()}
                          </p>

                          <div className="flex items-center text-gray-400 mb-3">
                            <FiShield className="mr-2" />
                            <span className="text-sm">Permissions:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {app.permissions.map((permission, index) => (
                              <span
                                key={index}
                                className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
                              >
                                {permission.replace(/[-_]/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => disconnectApp(app.app_type)}
                          className="text-red-500 hover:text-red-600 transition-colors ml-4"
                          aria-label="Disconnect app"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Integrations */}
            <div className="bg-gray-800 rounded-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-4">Available Integrations</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`border border-gray-700 rounded-lg p-4 ${isSpotifyConnected ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center mb-2">
                    <FiMusic className="w-6 h-6 text-green-500 mr-3" />
                    <h3 className="text-white font-medium">Spotify</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Enable music commands, now playing updates, and playlist management.
                  </p>
                  {isSpotifyConnected ? (
                    <span className="text-green-500 text-sm">✓ Connected</span>
                  ) : (
                    <button
                      onClick={connectSpotify}
                      disabled={connecting === 'spotify'}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white py-2 px-4 rounded transition-colors"
                    >
                      {connecting === 'spotify' ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>

                <div className="border border-gray-700 rounded-lg p-4 opacity-50">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 text-blue-500 mr-3">🎮</div>
                    <h3 className="text-white font-medium">Discord</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Sync bot commands and settings across Discord servers.
                  </p>
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-400 py-2 px-4 rounded cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
