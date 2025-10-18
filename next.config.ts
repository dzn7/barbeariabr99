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
};

export default nextConfig;
