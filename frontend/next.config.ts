import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "https://footsore-uptake-autopilot.ngrok-free.dev";

const nextConfig: NextConfig = {
  // API proxying is handled by src/app/api/[...path]/route.ts
  // which explicitly forwards cookies. Do not add rewrites here
  // to avoid conflicts.
};

export default nextConfig;
