import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  assetPrefix: "/dine-assets",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  env: {
    NEXT_PUBLIC_FORGE_API_KEY: process.env.VITE_FRONTEND_FORGE_API_KEY,
    NEXT_PUBLIC_FORGE_API_URL: process.env.VITE_FRONTEND_FORGE_API_URL,
  },
  async headers() {
    return [{ source: "/", headers: [{ key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" }] }];
  },
};

export default nextConfig;
