'use client';

import { motion } from 'framer-motion';

export default function HomeSection({ botName }) {
  return (
    <div className="text-center">
      <motion.h1
        className="text-5xl font-extrabold mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {botName}
      </motion.h1>
    </div>
  );
}
