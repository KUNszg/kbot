'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight,
  FiFilter
} from 'react-icons/fi';
import Image from 'next/image';

interface Emote {
  ID: number;
  channel: string;
  emote: string;
  url: string;
  type: 'bttv' | 'ffz' | '7tv';
  emoteId: string | null;
  sevenTvId: string | null;
  date: string;
}

export default function EmoteCheckerSection() {
  const [search, setSearch] = useState('');
  const [monitoredChannels, setMonitoredChannels] = useState<string[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchedChannel, setSearchedChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotes, setEmotes] = useState<Emote[]>([]);
  const [stats, setStats] = useState({
    totalAdded: 0,
    totalRemoved: 0,
    currentTotal: 0,
    bttv: 0,
    ffz: 0,
    sevenTv: 0
  });
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'added' | 'removed'>('added');
  const [activeFilter, setActiveFilter] = useState<'all' | 'bttv' | 'ffz' | 'sevenTv'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/channels')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMonitoredChannels(data.map(c => c.channel));
      });
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setFilteredChannels(
      monitoredChannels.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, monitoredChannels]);

  useEffect(() => {
    if (searchedChannel) fetchData(page);
  }, [page, viewMode, activeFilter]);

  const fetchData = async (targetPage: number, overrideChannel?: string) => {
    const channel = overrideChannel || searchedChannel;
    setLoading(true);
    try {
      const typeParam =
        activeFilter !== 'all'
          ? `&type=${activeFilter === 'sevenTv' ? '7tv' : activeFilter}`
          : '';
      const res = await fetch(
        `/api/emotes?search=${encodeURIComponent(channel.toLowerCase())}&page=${targetPage}&limit=50&view=${viewMode}${typeParam}`
      );
      const data = await res.json();
      setEmotes(data.emotes || []);
      setStats(data.stats);
      setTotalPages(data.totalPages || 1);
      setLastUpdate(data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : 'Never');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSearch = (e?: React.FormEvent, channelName?: string) => {
    if (e) e.preventDefault();
    const target = channelName || search;
    if (!target.trim()) return;
    setSearchedChannel(target);
    setShowSuggestions(false);
    setPage(1);
    setActiveFilter('all');
    fetchData(1, target);
  };

  const toggleFilter = (filter: 'bttv' | 'ffz' | 'sevenTv') => {
    setPage(1);
    setActiveFilter(prev => (prev === filter ? 'all' : filter));
  };

  const handleViewChange = (mode: 'added' | 'removed') => {
    setViewMode(mode);
    setPage(1);
    setActiveFilter('all');
  };

  const getProviderUrl = (emote: Emote) => {
    const isVal = (v: any) => v && v !== '\\N' && v !== 'null';
    if (emote.type === '7tv' && isVal(emote.sevenTvId))
      return `https://7tv.app/emotes/${emote.sevenTvId}`;
    if (emote.type === 'ffz' && isVal(emote.emoteId))
      return `https://www.frankerfacez.com/emoticon/${emote.emoteId}`;
    if (emote.type === 'bttv') {
      const id = isVal(emote.emoteId)
        ? emote.emoteId
        : emote.url.split('/emote/')[1]?.split('/')[0];
      if (id) return `https://betterttv.com/emotes/${id}`;
    }
    return null;
  };

  const handleRowClick = (emote: Emote) => {
    const providerUrl = getProviderUrl(emote);
    if (providerUrl) window.open(providerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleImageClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative min-h-screen pb-20 max-w-6xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-extrabold mb-2 text-white">
          Emote <span className="text-[#9146FF]">Checker</span>
        </h1>
        <p className="text-gray-400">Track additions and removals in monitored channels</p>
      </motion.div>

      <div className="max-w-2xl mx-auto mb-10 relative" ref={suggestionRef}>
        <form onSubmit={e => handleInitialSearch(e)} className="relative flex gap-2">
          <input
            type="text"
            value={search}
            onFocus={() => setShowSuggestions(true)}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search channel..."
            className="w-full bg-gray-800 text-white px-6 py-4 rounded-lg border border-gray-700 focus:border-[#9146FF] outline-none transition-colors"
          />
          <button
            type="submit"
            className="bg-[#9146FF] hover:bg-[#7c3aed] px-6 rounded-lg transition-colors cursor-pointer text-white"
          >
            <FiSearch size={20} />
          </button>
        </form>

        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto"
            >
              {filteredChannels.map((channel, idx) => (
                <div
                  key={`${channel}-${idx}`}
                  onClick={() => {
                    setSearch(channel);
                    handleInitialSearch(undefined, channel);
                  }}
                  className="p-4 hover:bg-[#9146FF]/20 cursor-pointer text-white border-b border-gray-700 last:border-0"
                >
                  {channel}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading && page === 1 ? (
        <div className="text-center text-gray-400 py-10">Fetching records...</div>
      ) : emotes.length > 0 || activeFilter !== 'all' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <button
              onClick={() => toggleFilter('bttv')}
              className={`p-6 rounded-lg border transition-all flex flex-col justify-center min-h-[110px] cursor-pointer ${activeFilter === 'bttv' ? 'bg-[#9146FF]/20 border-[#9146FF] shadow-[0_0_15px_rgba(145,70,255,0.3)]' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
            >
              <div className="text-3xl font-bold text-[#9146FF]">{stats.bttv}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">BTTV</div>
            </button>
            <button
              onClick={() => toggleFilter('ffz')}
              className={`p-6 rounded-lg border transition-all flex flex-col justify-center min-h-[110px] cursor-pointer ${activeFilter === 'ffz' ? 'bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
            >
              <div className="text-3xl font-bold text-green-500">{stats.ffz}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">FFZ</div>
            </button>
            <button
              onClick={() => toggleFilter('sevenTv')}
              className={`p-6 rounded-lg border transition-all flex flex-col justify-center min-h-[110px] cursor-pointer ${activeFilter === 'sevenTv' ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
            >
              <div className="text-3xl font-bold text-blue-500">{stats.sevenTv}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">7TV</div>
            </button>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center flex flex-col justify-center min-h-[110px]">
              <div className="text-sm font-bold text-white leading-tight">{lastUpdate}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
                Last Scanned
              </div>
            </div>
          </div>

          <div className="flex justify-center flex-col items-center gap-4">
            <div className="inline-flex rounded-lg bg-gray-900 p-1 border border-gray-800 shadow-inner">
              <button
                onClick={() => handleViewChange('added')}
                className={`px-8 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'added' ? 'bg-[#9146FF] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Added ({stats.totalAdded})
              </button>
              <button
                onClick={() => handleViewChange('removed')}
                className={`px-8 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'removed' ? 'bg-[#9146FF] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Removed ({stats.totalRemoved})
              </button>
            </div>
            {activeFilter !== 'all' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-[#9146FF] bg-[#9146FF]/10 px-3 py-1 rounded-full border border-[#9146FF]/30 text-xs"
              >
                <FiFilter /> Filtering by {activeFilter.toUpperCase()}
                <button
                  onClick={() => setActiveFilter('all')}
                  className="ml-1 hover:text-white cursor-pointer font-bold"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-2xl relative">
            {loading && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center text-white font-bold">
                Updating...
              </div>
            )}
            <table className="w-full text-left table-fixed">
              <thead className="bg-black/30 text-gray-400 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4 w-20">Emote</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 w-24">Type</th>
                  <th className="px-6 py-4 w-32">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {emotes.length > 0 ? (
                  emotes.map((emote, idx) => (
                    <tr
                      key={idx}
                      onClick={() => handleRowClick(emote)}
                      className="hover:bg-white/5 group cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div
                          className="relative w-8 h-8 hover:scale-125 transition-transform"
                          onClick={e => handleImageClick(e, emote.url)}
                        >
                          <Image
                            src={emote.url}
                            alt={emote.emote}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium group-hover:text-[#9146FF]">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="truncate">{emote.emote}</span>
                          <FiExternalLink className="shrink-0 opacity-0 group-hover:opacity-100 text-xs transition-opacity" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase border border-gray-600 ${emote.type === '7tv' ? 'text-blue-400' : emote.type === 'ffz' ? 'text-green-400' : 'text-purple-400'}`}
                        >
                          {emote.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs truncate">
                        {new Date(emote.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500 italic">
                      No emotes found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 disabled:opacity-20 cursor-pointer hover:bg-gray-700"
            >
              <FiChevronLeft size={24} />
            </button>
            <div className="text-gray-400 text-sm font-medium">
              Page <span className="text-white font-bold">{page}</span> of{' '}
              <span className="text-white font-bold">{totalPages}</span>
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 disabled:opacity-20 cursor-pointer hover:bg-gray-700"
            >
              <FiChevronRight size={24} />
            </button>
          </div>
        </div>
      ) : (
        searchedChannel &&
        !loading && (
          <div className="text-center text-gray-500 py-20 italic bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
            No records found for "{searchedChannel}"
          </div>
        )
      )}
    </div>
  );
}
