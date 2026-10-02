import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/projects/lunafantasy", destination: "/projects/content-platform", permanent: true }, { source: "/og.jpg", destination: "/og-v2.jpg", permanent: true }];
  },
  images: {
    // Case assets are already compressed; serve them directly when Vercel's CDN is unreachable.
    unoptimized: true,
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
