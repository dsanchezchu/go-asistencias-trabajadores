import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // @ts-ignore - Turbopack config structure may not be fully typed in the active version
  turbopack: {
    root: '../',
  },
};

export default nextConfig;
