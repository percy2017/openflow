import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["openflow.local"],
  devIndicators: false,
};

export default nextConfig;
