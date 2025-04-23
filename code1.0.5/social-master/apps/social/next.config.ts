import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        minSize: 20000,
        maxSize: 240000,
        chunks: 'all',
      };
    }
    return config;
  },

  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'https',
        hostname: 'osdawghfaoyysblfsexp.supabase.co',
        pathname: '/storage/v1/object/public/avatars/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 实验性功能
  experimental: {
    optimizeCss: true, // CSS 优化
    mdxRs: true, // 使用 Rust 编译 MDX
    reactCompiler: true, // 使用 React 编译器
  },
};

export default nextConfig;
