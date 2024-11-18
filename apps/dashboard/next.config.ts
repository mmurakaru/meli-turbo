import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
  experimental: {
    ppr: 'incremental',
  },
};

export default nextConfig;
