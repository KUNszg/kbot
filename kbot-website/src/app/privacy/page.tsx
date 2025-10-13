'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

import SessionProvider from '../providers/SessionProvider';
import SharedLayout from '../components/SharedLayout';

export default function PrivacyPolicyPage() {
  return (
    <SessionProvider>
      <SharedLayout>
        <div className="min-h-screen bg-gray-900 text-white py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center text-[#9146FF] hover:text-[#7c3aed] mb-8 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Home
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              </div>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">1. Introduction</h2>
                <p className="text-gray-300">
                  Welcome to KsyncBot. This is a personal project developed and maintained by
                  me as an individual developer. This Privacy Policy explains how I collect,
                  use, and protect your information when you use my Twitch bot and related
                  services.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">
                  2. Information that I Collect
                </h2>
                <div className="space-y-3 text-gray-300">
                  <h3 className="text-lg font-medium text-white">2.1 Account Information</h3>
                  <p>When you sign in with Twitch, my service collects:</p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Your Twitch username</li>
                    <li>Your Twitch user ID</li>
                    <li>Your email address (if provided by Twitch)</li>
                    <li>Your profile picture</li>
                  </ul>

                  <h3 className="text-lg font-medium text-white mt-4">
                    2.2 Connected Services
                  </h3>
                  <p>If you connect additional services (e.g., Spotify), I collect:</p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Access tokens to interact with these services on your behalf</li>
                    <li>Basic profile information from the connected service</li>
                    <li>Permissions you grant for specific features</li>
                  </ul>

                  <h3 className="text-lg font-medium text-white mt-4">2.3 Usage Data</h3>
                  <p>I may collect:</p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Bot command usage</li>
                    <li>Chat messages where the bot is mentioned</li>
                    <li>Emote tracking data (additions/removals in channels)</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">
                  3. How I Use Your Information
                </h2>
                <p className="text-gray-300">I use the collected information to:</p>
                <ul className="list-disc list-inside pl-4 space-y-1 text-gray-300">
                  <li>Provide and maintain my bot services</li>
                  <li>Authenticate your account and maintain your session</li>
                  <li>Execute bot commands on your behalf</li>
                  <li>Display statistics and analytics related to bot usage</li>
                  <li>Improve my services and develop new features</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">
                  4. Cookies and Tracking
                </h2>
                <p className="text-gray-300">
                  I use essential cookies for authentication and session management. These
                  cookies are necessary for the website to function properly and cannot be
                  disabled. I do not use tracking cookies or third-party analytics.
                </p>
                <div className="bg-gray-800 p-4 rounded-lg mt-2">
                  <p className="text-sm text-gray-400">
                    <strong>Essential Cookies:</strong> Used for login sessions and maintaining
                    your authenticated state via NextAuth.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">5. Data Sharing</h2>
                <p className="text-gray-300">
                  I do not sell, trade, or rent your personal information to third parties. I
                  may share your information only in the following cases:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1 text-gray-300">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect my rights and prevent fraud</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">6. Data Security</h2>
                <p className="text-gray-300">
                  I implement appropriate technical and organizational measures to protect your
                  personal information. However, no method of transmission over the Internet is
                  100% secure, and I cannot guarantee absolute security.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">7. Your Rights</h2>
                <p className="text-gray-300">You have the right to:</p>
                <ul className="list-disc list-inside pl-4 space-y-1 text-gray-300">
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of specific bot commands</li>
                  <li>Disconnect linked services at any time</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">8. Data Retention</h2>
                <p className="text-gray-300">
                  I retain your data for as long as your account is active or as needed to
                  provide services. You can request deletion of your account and associated
                  data at any time.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">
                  9. Third-Party Services
                </h2>
                <p className="text-gray-300">
                  My service integrates with third-party platforms (Twitch, Spotify, etc.).
                  Please review their privacy policies:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1 text-gray-300">
                  <li>
                    <a
                      href="https://www.twitch.tv/p/legal/privacy-notice/"
                      className="text-[#9146FF] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Twitch Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.spotify.com/privacy/"
                      className="text-[#9146FF] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Spotify Privacy Policy
                    </a>
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">
                  10. Children&apos;s Privacy
                </h2>
                <p className="text-gray-300">
                  My service is not intended for users under 13 years of age. I do not
                  knowingly collect personal information from children under 13.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">
                  11. Changes to This Policy
                </h2>
                <p className="text-gray-300">
                  I may update this Privacy Policy from time to time. I will notify you of any
                  changes by updating the &quot;Last updated&quot; date at the top of this
                  policy.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#9146FF]">12. Contact Me</h2>
                <p className="text-gray-300">
                  If you have any questions about this Privacy Policy, please contact me
                  through:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1 text-gray-300">
                  <li>
                    GitHub:{' '}
                    <a
                      href="https://github.com/kunszg"
                      className="text-[#9146FF] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      github.com/kunszg
                    </a>
                  </li>
                  <li>
                    Website:{' '}
                    <a href="https://kunszg.com" className="text-[#9146FF] hover:underline">
                      kunszg.com
                    </a>
                  </li>
                  <li>
                    Email:{' '}
                    <a href="mailto:dev@kunszg.com" className="text-[#9146FF] hover:underline">
                      dev@kunszg.com
                    </a>
                  </li>
                </ul>
              </section>

              <div className="border-t border-gray-700 pt-8 mt-8">
                <p className="text-gray-500 text-sm">
                  This is a personal project. By using KsyncBot, you agree to this Privacy
                  Policy.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </SharedLayout>
    </SessionProvider>
  );
}
