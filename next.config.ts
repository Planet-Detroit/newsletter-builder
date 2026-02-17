import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  // Force cache bust
  generateBuildId: () => `build-${Date.now()}`,
};

export default nextConfig;
