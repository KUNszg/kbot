'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiMessageSquare, FiClock, FiRadio, FiActivity, FiCode } from 'react-icons/fi';

interface Stats {
  users: number;
  messages: number;
  uptime: string;
  channelsMonitored: number;
  linesOfCode: number;
  messageRate: number;
}

type NumericStatKey = Exclude<keyof Stats, 'uptime'>;

const ZERO_STATS: Stats = {
  users: 0,
  messages: 0,
  uptime: '0h 0m',
  channelsMonitored: 0,
  linesOfCode: 0,
  messageRate: 0
};

const NUMERIC_KEYS: NumericStatKey[] = [
  'users',
  'messages',
  'channelsMonitored',
  'linesOfCode',
  'messageRate'
];

const REFRESH_INTERVAL_MS = 15000;
const DELTA_VISIBLE_MS = 5000;

const compactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const STAT_DEFS: {
  key: keyof Stats;
  label: string;
  icon: React.ReactNode;
  format: (value: number | string) => string;
}[] = [
  {
    key: 'users',
    label: 'Users',
    icon: <FiUsers size={20} />,
    format: v => compactNumber(Number(v))
  },
  {
    key: 'messages',
    label: 'Commands run',
    icon: <FiMessageSquare size={20} />,
    format: v => compactNumber(Number(v))
  },
  {
    key: 'channelsMonitored',
    label: 'Channels',
    icon: <FiRadio size={20} />,
    format: v => compactNumber(Number(v))
  },
  {
    key: 'messageRate',
    label: 'Message rate',
    icon: <FiActivity size={20} />,
    format: v => `${Number(v).toFixed(2)}/s`
  },
  {
    key: 'linesOfCode',
    label: 'Lines of code',
    icon: <FiCode size={20} />,
    format: v => compactNumber(Number(v))
  },
  { key: 'uptime', label: 'Uptime', icon: <FiClock size={20} />, format: v => String(v) }
];

function formatDelta(key: NumericStatKey, delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return key === 'messageRate' ? `${sign}${delta.toFixed(2)}` : `${sign}${compactNumber(delta)}`;
}

function DeltaBadge({ delta, deltaKey }: { delta: number; deltaKey: NumericStatKey }) {
  const isUp = delta > 0;
  return (
    <motion.span
      key={`${deltaKey}-${delta}-${isUp}`}
      initial={{ opacity: 0, y: isUp ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="text-xs font-semibold whitespace-nowrap"
      style={{ color: isUp ? '#0ca30c' : '#d03b3b' }}
    >
      {isUp ? '▲' : '▼'} {formatDelta(deltaKey, delta)}
    </motion.span>
  );
}

export default function LiveStatsSection() {
  const [stats, setStats] = useState<Stats>(ZERO_STATS);
  const [deltas, setDeltas] = useState<Partial<Record<NumericStatKey, number>>>({});
  const prevStatsRef = useRef<Stats | null>(null);
  const clearDeltasTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.error) return;

        const previous = prevStatsRef.current;
        if (previous) {
          const newDeltas: Partial<Record<NumericStatKey, number>> = {};
          NUMERIC_KEYS.forEach(key => {
            const diff = data[key] - previous[key];
            if (Math.abs(diff) > 0.001) {
              newDeltas[key] = diff;
            }
          });

          if (Object.keys(newDeltas).length) {
            setDeltas(newDeltas);
            if (clearDeltasTimeoutRef.current) clearTimeout(clearDeltasTimeoutRef.current);
            clearDeltasTimeoutRef.current = setTimeout(() => setDeltas({}), DELTA_VISIBLE_MS);
          }
        }

        prevStatsRef.current = data;
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (clearDeltasTimeoutRef.current) clearTimeout(clearDeltasTimeoutRef.current);
    };
  }, []);

  return (
    <section className="max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
          Live Stats
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_DEFS.map(def => {
          const delta = def.key === 'uptime' ? undefined : deltas[def.key as NumericStatKey];

          return (
            <motion.div
              key={def.key}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/60 border border-gray-700 rounded-xl p-5 text-center hover:border-[#9146FF]/50 transition-colors"
            >
              <div className="flex justify-center mb-3">
                <div className="p-2.5 rounded-full bg-[#9146FF]/10 text-[#9146FF]">
                  {def.icon}
                </div>
              </div>
              <div className="text-2xl font-semibold text-white">{def.format(stats[def.key])}</div>
              <div className="mt-1 text-xs text-gray-400">{def.label}</div>
              <div className="h-4 mt-1">
                <AnimatePresence>
                  {delta !== undefined && (
                    <DeltaBadge delta={delta} deltaKey={def.key as NumericStatKey} />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
