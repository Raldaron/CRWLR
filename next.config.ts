import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module?.rules?.push({
      test: /\.json$/,
      type: 'json',
    });
    return config;
  },
  // Enable static file serving through the /public folder
  images: {
    domains: [], // Add any external image domains you need here
  }
}

export default nextConfig;