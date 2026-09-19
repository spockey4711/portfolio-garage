import { execSync } from "node:child_process";
import type { NextConfig } from "next";

// The commit the footer names (docs/KONZEPT.md §10, lib/build/info.ts).
// Read once per build and inlined, so the running server needs neither git
// nor the variable. CI passes GITHUB_SHA as a build arg (Dockerfile), because
// the image build has no .git; locally git answers. Neither there means no
// commit in the footer, not a made-up one.
function commitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  // The Dockerfile copies .next/standalone, a self-contained server with only
  // the node_modules it traces, instead of the full install (docs/adr/0002).
  output: "standalone",
  env: {
    COMMIT_SHA: commitSha(),
  },
};

export default nextConfig;
