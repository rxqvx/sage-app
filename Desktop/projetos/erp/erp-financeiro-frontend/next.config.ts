import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  turbopack: {
    // Fixa a raiz neste diretorio. Sem isso o Turbopack sobe a arvore em busca
    // de um lockfile e encontra o do diretorio home, inferindo a raiz errada.
    root: __dirname,
  },
};

export default nextConfig;
