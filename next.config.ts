import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/moz9/ilgiz-yakhin/main/public/**",
      },
    ],
  },
};

export default nextConfig;
