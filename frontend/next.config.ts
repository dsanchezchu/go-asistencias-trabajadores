import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  basePath: '/proyectos/asistencias',
  output: 'export',
  distDir: 'out',

  images: {
    unoptimized: true,
  },

  // @ts-ignore
  turbopack: {
    root: '../',
  },
};

export default nextConfig;
