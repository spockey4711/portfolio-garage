import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// ".claude" holds skills and the worktrees the agent tooling checks out in-tree.
const exclude = ["node_modules", ".next", ".claude", "tests/e2e"];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "."),
    },
  },
  test: {
    globals: true,
    // Only component tests need a DOM; logic suites stay on plain Node.
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: ["**/*.test.ts"],
          exclude,
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          include: ["**/*.test.tsx"],
          exclude,
          environment: "jsdom",
        },
      },
    ],
  },
});
