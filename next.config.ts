import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Dockerfile copies .next/standalone, a self-contained server with only
  // the node_modules it traces, instead of the full install (docs/adr/0002).
  output: "standalone",
};

export default nextConfig;
