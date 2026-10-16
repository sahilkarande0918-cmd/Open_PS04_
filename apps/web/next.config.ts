import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@reel-studio/timeline-schema"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
