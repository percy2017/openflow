import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["openflow.test"],
  devIndicators: false,
};

export default nextConfig;
