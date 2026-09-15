import type { NextConfig } from "next";

const BACKEND_INTERNAL = "http://backend-app:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/auth/:path*",
          destination: `${BACKEND_INTERNAL}/auth/:path*`,
        },
        { source: "/email", destination: `${BACKEND_INTERNAL}/email` },
        { source: "/pubsub", destination: `${BACKEND_INTERNAL}/pubsub` },
        { source: "/api", destination: `${BACKEND_INTERNAL}/` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
