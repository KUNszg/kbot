import type { NextConfig } from 'next';
import path from 'path';
import fs from 'fs';

const internalCommons = path.resolve(__dirname, 'commons');
const externalCommons = path.resolve(__dirname, '../commons');

const commonsPath = fs.existsSync(internalCommons) ? internalCommons : externalCommons;

const workspaceRoot = path.resolve(__dirname, '../');

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,

  turbopack: {
    root: workspaceRoot,
    resolveAlias: {
      commons: commonsPath
    }
  },

  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      commons: commonsPath
    };
    return config;
  }
};

export default nextConfig;
