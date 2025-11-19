'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiCode, FiClock } from 'react-icons/fi';

interface Command {
  ID: number;
  command: string;
  aliases: string | null;
  cooldown: number;
  permissions: number;
  date: string;
  description: string;
  optoutable: 'Y' | 'N';
  usage: string | null;
}

export default function CommandsSection() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCommands();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = commands.filter(
        cmd =>
          cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.aliases?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCommands(filtered);
    } else {
      setFilteredCommands(commands);
    }
  }, [searchTerm, commands]);

  const fetchCommands = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/commands');
      const data = await response.json();
      if (data.commands) {
        setCommands(data.commands);
        setFilteredCommands(data.commands);
      }
    } catch (error) {
      console.error('Error fetching commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCooldown = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const parseUsage = (usage: string | null) => {
    if (!usage) return [];
    return usage.split(';').filter(u => u.trim());
  };

  return (
    <div className="min-h-screen text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-extrabold mb-2 text-white">
          <span className="text-white">Bot</span>
          <span className="text-[#9146FF]"> Commands</span>
        </h1>
        <p className="text-gray-400 mt-2">List of all available commands for KsyncBot</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search commands..."
            className="w-full bg-gray-800 text-white px-6 py-4 pr-14 rounded-lg border border-gray-700 focus:border-[#9146FF] focus:outline-none transition-colors"
          />
          <FiSearch
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center text-gray-400">Loading commands...</div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="text-gray-400 text-sm mb-4">
            Showing {filteredCommands.length} of {commands.length} commands
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Command
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Aliases
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Cooldown
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Opt-out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Usage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredCommands.map(cmd => (
                    <tr key={cmd.ID} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FiCode className="text-[#9146FF] mr-2" size={16} />
                          <span className="text-white font-mono font-medium">
                            kb {cmd.command}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cmd.aliases ? (
                          <div className="flex flex-wrap gap-1">
                            {cmd.aliases.split(';').map((alias, idx) => {
                              const aliasName = alias.includes('>')
                                ? alias.split('>')[0]
                                : alias;
                              return (
                                <span
                                  key={idx}
                                  className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded font-mono"
                                >
                                  {aliasName}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-300">
                          <FiClock className="mr-1" size={14} />
                          <span className="text-sm">{formatCooldown(cmd.cooldown)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cmd.optoutable === 'Y' ? (
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                            Yes
                          </span>
                        ) : (
                          <span className="bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-gray-300 text-sm">
                          {cmd.description || 'No description'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {cmd.usage ? (
                          <details className="cursor-pointer">
                            <summary className="text-[#9146FF] hover:text-[#7c3aed] text-sm">
                              View usage
                            </summary>
                            <div className="mt-2 space-y-1">
                              {parseUsage(cmd.usage).map((usage, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-900 p-2 rounded text-xs font-mono text-gray-300"
                                >
                                  {usage}
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredCommands.length === 0 && searchTerm && (
            <div className="text-center text-gray-400 py-8">
              No commands found matching &ldquo;{searchTerm}&rdquo;
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
