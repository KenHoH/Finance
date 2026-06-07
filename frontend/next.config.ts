import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API proxying is handled by src/app/api/[...path]/route.ts
  // which explicitly forwards cookies and CSRF tokens.
};

export default nextConfig;
