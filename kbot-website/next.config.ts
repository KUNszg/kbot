import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: config => {
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules')
    ];

    return config;
  }
};

export default nextConfig;
