'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Module {
  name: string;
  label: string;
  online: boolean;
  lastSeen: number | null;
}

const REFRESH_INTERVAL_MS = 15000;

function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function ConnectedModulesSection() {
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/modules');
        const data = await response.json();
        if (Array.isArray(data.modules)) {
          setModules(data.modules);
        }
      } catch (error) {
        console.error('Error fetching module status:', error);
      }
    };

    fetchModules();
    const interval = setInterval(fetchModules, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!modules.length) return null;

  return (
    <section className="max-w-7xl mx-auto w-full">
      <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase text-center mb-4">
        Service Status
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        {modules.map(module => (
          <motion.div
            key={module.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 bg-gray-900/60 border border-gray-700 rounded-full px-3 py-1.5 text-xs"
          >
            <span className="relative flex h-2 w-2">
              {module.online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  module.online ? 'bg-green-500' : 'bg-gray-600'
                }`}
              />
            </span>
            <span className="text-gray-300">{module.label}</span>
            {!module.online && module.lastSeen && (
              <span className="text-gray-500">· {formatRelativeTime(module.lastSeen)}</span>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
