'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBarChart2, FiUsers, FiMessageSquare, FiClock } from 'react-icons/fi';

export default function StatsBox({ stats }) {
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      {/* Bubble Button for Mobile */}
      <button
        onClick={() => setShowStats(true)}
        className="md:hidden fixed bottom-4 right-4 bg-[#9146FF] text-white p-4 rounded-full shadow-lg flex items-center justify-center"
      >
        <FiBarChart2 size={24} />
      </button>

      {/* Desktop Stats Box */}
      <div className="hidden md:block absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg w-64 text-left">
        <h2 className="text-lg font-semibold text-center">Live Stats</h2>
        <div className="flex justify-between border-b border-gray-600 py-1">
          <span>👥 Users:</span> <span className="font-bold">{stats.users}</span>
        </div>
        <div className="flex justify-between border-b border-gray-600 py-1">
          <span>💬 Messages:</span> <span className="font-bold">{stats.messages}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>⏳ Uptime:</span> <span className="font-bold">{stats.uptime}</span>
        </div>
      </div>

      {/* Mobile Stats Modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStats(false)}
          >
            <motion.div
              className="bg-gray-800 p-6 rounded-lg shadow-xl text-center w-72"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 text-[#9146FF]">Live Stats</h2>
              <div className="grid gap-3">
                <StatItem icon={<FiUsers />} label="Users" value={stats.users} />
                <StatItem icon={<FiMessageSquare />} label="Messages" value={stats.messages} />
                <StatItem icon={<FiClock />} label="Uptime" value={stats.uptime} />
              </div>
              <button
                onClick={() => setShowStats(false)}
                className="mt-4 p-2 bg-red-500 rounded-lg text-white w-full"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Stat item component
const StatItem = ({ icon, label, value }) => (
  <div className="flex items-center bg-gray-700 p-3 rounded-lg shadow">
    <span className="text-[#9146FF] mr-2">{icon}</span>
    <p className="text-lg">
      {label}: {value}
    </p>
  </div>
);
