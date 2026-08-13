import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FORGE_API_KEY: process.env.VITE_FRONTEND_FORGE_API_KEY,
    NEXT_PUBLIC_FORGE_API_URL: process.env.VITE_FRONTEND_FORGE_API_URL,
  },
};

export default nextConfig;
