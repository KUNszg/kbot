'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { FiGithub } from 'react-icons/fi';

interface HomeSectionProps {
  botName: React.ReactNode;
}

interface ChatLine {
  user: string;
  color: string;
  text: string;
  isBot?: boolean;
}

const CHAT_LOG: ChatLine[] = [
  { user: 'pajlada', color: '#e0a3ff', text: 'kb ping' },
  { user: 'KsyncBot', color: '#9146FF', text: 'PONG! 12ms | uptime: 4h 12m', isBot: true },
  { user: 'vadikus007', color: '#5cc9f5', text: 'kb music' },
  {
    user: 'KsyncBot',
    color: '#9146FF',
    text: '🎵 now playing: Never Gonna Give You Up — Rick Astley',
    isBot: true
  },
  { user: 'woyahcoo', color: '#7be37a', text: 'kb commands' },
  { user: 'KsyncBot', color: '#9146FF', text: 'full list → kunszg.com/commands', isBot: true }
];

const LINKS = [
  { href: '/commands', label: 'browse commands' },
  { href: '/emotechecker', label: 'emote checker' },
  { href: '/docs', label: 'docs' }
];

export default function HomeSection({ botName }: HomeSectionProps) {
  const { data: session, status } = useSession();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            {botName}
          </motion.h1>

          <motion.p
            className="text-lg text-gray-300 mb-8 max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Lives in your Twitch chat and answers to{' '}
            <code className="font-mono text-[#9146FF]">kb</code> — song requests, emote
            tracking, chat commands.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-x-5 gap-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            {session ? (
              <Link
                href="/account"
                className="px-5 py-2.5 rounded-md font-medium text-white bg-[#9146FF] hover:bg-[#772ce8] transition-colors"
              >
                Go to account
              </Link>
            ) : (
              <button
                onClick={() => signIn('twitch', { callbackUrl: '/account' })}
                disabled={status === 'loading'}
                className="px-5 py-2.5 rounded-md font-medium text-white bg-[#9146FF] hover:bg-[#772ce8] transition-colors disabled:opacity-60 disabled:cursor-wait cursor-pointer"
              >
                {status === 'loading' ? 'loading…' : 'Login with Twitch'}
              </button>
            )}

            {LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4 decoration-gray-600"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="https://github.com/kunszg/kbot"
              target="_blank"
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <FiGithub size={14} /> source
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="rounded-lg border border-gray-700 bg-black/40 overflow-hidden font-mono text-sm shadow-2xl"
        >
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-700 bg-gray-900/60">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-gray-500">#nymn</span>
          </div>
          <div className="p-4 space-y-1.5">
            {CHAT_LOG.map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 + index * 0.25 }}
              >
                <span style={{ color: line.color }} className="font-semibold">
                  {line.user}
                </span>
                <span className="text-gray-500">: </span>
                <span className={line.isBot ? 'text-gray-200' : 'text-gray-300'}>
                  {line.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
