'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import Image from 'next/image';

interface Emote {
  ID: number;
  userId: string;
  channel: string;
  emote: string;
  url: string;
  type: 'bttv' | 'ffz' | '7tv';
  emoteId: number;
  sevenTvId: string;
  date: string;
}

interface EmoteStats {
  bttv: number;
  ffz: number;
  '7tv': number;
  total: number;
}

export default function EmoteCheckerSection() {
  const [search, setSearch] = useState('');
  const [searchedChannel, setSearchedChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotesAdded, setEmotesAdded] = useState<Emote[]>([]);
  const [emotesRemoved, setEmotesRemoved] = useState<Emote[]>([]);
  const [stats, setStats] = useState<EmoteStats>({ bttv: 0, ffz: 0, '7tv': 0, total: 0 });
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'added' | 'removed'>('added');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setSearchedChannel(search);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/emotes?search=${encodeURIComponent(search.toLowerCase())}`
      );
      const data = await response.json();

      if (data.emotesAdded) {
        setEmotesAdded(data.emotesAdded);
        setEmotesRemoved(data.emotesRemoved || []);
        setStats(data.stats);
        setLastUpdate(data.lastUpdate || 'Unknown');
      } else {
        setEmotesAdded([]);
        setEmotesRemoved([]);
        setStats({ bttv: 0, ffz: 0, '7tv': 0, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching emotes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-extrabold mb-2">
            <span className="text-white">Emote</span>
            <span className="text-[#9146FF]"> Checker</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Track emote additions and removals in Twitch channels
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for channel..."
              autoComplete="off"
              className="w-full bg-gray-800 text-white px-6 py-4 pr-14 rounded-lg border border-gray-700 focus:border-[#9146FF] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#9146FF] hover:bg-[#7c3aed] disabled:bg-gray-600 text-white p-3 rounded-lg transition-colors"
            >
              <FiSearch size={20} />
            </button>
          </form>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : emotesAdded.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
                <div className="text-2xl font-bold text-[#9146FF]">{stats.bttv}</div>
                <div className="text-sm text-gray-400">BTTV Emotes</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
                <div className="text-2xl font-bold text-green-500">{stats.ffz}</div>
                <div className="text-sm text-gray-400">FFZ Emotes</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
                <div className="text-2xl font-bold text-blue-500">{stats['7tv']}</div>
                <div className="text-sm text-gray-400">7TV Emotes</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
            </div>

            <div className="text-center text-gray-400 text-sm mb-4">
              Last updated: {lastUpdate}
            </div>

            {/* Toggle Buttons */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg bg-gray-900 p-1">
                <button
                  onClick={() => setViewMode('added')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'added'
                      ? 'bg-[#9146FF] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Added Emotes ({emotesAdded.length})
                </button>
                <button
                  onClick={() => setViewMode('removed')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'removed'
                      ? 'bg-[#9146FF] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Removed Emotes ({emotesRemoved.length})
                </button>
              </div>
            </div>

            {/* Added Emotes Table */}
            {viewMode === 'added' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">Added Emotes</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Emote
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Date Added
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {emotesAdded.map((emote, index) => (
                        <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <Image
                              src={emote.url}
                              alt={emote.emote}
                              width={32}
                              height={32}
                              className="object-contain"
                              unoptimized
                            />
                          </td>
                          <td className="px-6 py-4 text-white">{emote.emote}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                emote.type === 'bttv'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : emote.type === 'ffz'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {emote.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {new Date(emote.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Removed Emotes Table */}
            {viewMode === 'removed' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">Removed Emotes</h2>
                </div>
                {emotesRemoved.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Emote
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Date Removed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {emotesRemoved.map((emote, index) => (
                          <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4">
                              <Image
                                src={emote.url}
                                alt={emote.emote}
                                width={32}
                                height={32}
                                className="object-contain"
                                unoptimized
                              />
                            </td>
                            <td className="px-6 py-4 text-white">{emote.emote}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  emote.type === 'bttv'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : emote.type === 'ffz'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-blue-500/20 text-blue-400'
                                }`}
                              >
                                {emote.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400">
                              {new Date(emote.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No removed emotes found for this channel
                  </div>
                )}
              </div>
            )}

            <div className="text-center text-gray-500 text-sm mt-8">
              Emote checker is based on logs from KsyncBot
            </div>
          </motion.div>
        ) : searchedChannel && !loading ? (
          <div className="text-center text-gray-400">
            No emote data found for channel &ldquo;{searchedChannel}&rdquo;
          </div>
        ) : null}
      </div>
    </div>
  );
}
