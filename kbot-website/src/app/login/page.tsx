'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Image
            src="/kbot-logo.png"
            alt="KsyncBot Logo"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to KsyncBot</h1>
          <p className="text-gray-400">Sign in to manage your bot settings</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6">
            {error === 'OAuthAccountNotLinked'
              ? 'This account is already linked to another user.'
              : 'An error occurred during sign in. Please try again.'}
          </div>
        )}

        <button
          onClick={() => signIn('twitch', { callbackUrl: '/' })}
          className="w-full bg-[#9146FF] hover:bg-[#7c3aed] text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3"
        >
          <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
          <span>Sign in with Twitch</span>
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-400 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
