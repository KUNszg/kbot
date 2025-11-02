'use client';

import { motion } from 'framer-motion';

export default function PrivacySection() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Introduction</h2>
            <p>
              Welcome to KsyncBot. This Privacy Policy explains how we collect, use, and
              protect your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Information We Collect</h2>
            <p>We collect information you provide when using our bot, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Twitch account information (username, email, profile picture)</li>
              <li>Connected service data (Spotify, Discord)</li>
              <li>Usage data and bot interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provide and maintain our service</li>
              <li>Enable integrations with third-party services</li>
              <li>Improve user experience</li>
              <li>Communicate important updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information.
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Third-Party Services</h2>
            <p>
              Our service integrates with third-party platforms (Twitch, Spotify, Discord).
              Please review their privacy policies as well.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Access your personal data</li>
              <li>Request data deletion</li>
              <li>Disconnect third-party integrations</li>
              <li>Opt-out of data collection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through
              your account settings.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
