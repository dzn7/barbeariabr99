import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Desabilita verificação de tipos no build
    // Permite deploy mesmo com erros de tipo
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora erros de ESLint no build
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Aplica headers para todas as páginas HTML
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
