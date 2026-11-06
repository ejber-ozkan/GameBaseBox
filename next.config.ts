import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  typescript: {
    tsconfigPath: 'tsconfig.build.json',
  },
  images: {
    unoptimized: true,
  },
  // LAN hosts allowed to open the dev server, e.g. NEXT_ALLOWED_DEV_ORIGINS=192.168.1.20,mypc.local
  allowedDevOrigins: (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export default nextConfig;
