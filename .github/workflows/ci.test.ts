import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Locks the approved CI shape: Playwright is its own job and a required gate
// before image and deploy. The Node gate stays browser-free. Deploy steps are
// not part of this assertion beyond the needs line.

const workflow = readFileSync(new URL("./ci.yml", import.meta.url), "utf8");

function jobBlock(id: string): string {
  const marker = `\n  ${id}:\n`;
  const start = workflow.indexOf(marker);
  if (start < 0) throw new Error(`job ${id} not found`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

function needs(block: string): string[] {
  const match = block.match(/^    needs:\s*(.+)$/m);
  if (!match) return [];
  const raw = match[1].trim();
  if (raw.startsWith("[")) {
    return raw
      .slice(1, raw.indexOf("]"))
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [raw];
}

describe("ci playwright gate", () => {
  const qualityGate = jobBlock("quality-gate");
  const e2e = jobBlock("e2e");
  const image = jobBlock("image");
  const deploy = jobBlock("deploy-develop");

  it("keeps the node gate free of a browser", () => {
    expect(qualityGate).not.toContain("test:e2e");
    expect(qualityGate).not.toContain("playwright");
  });

  it("runs the existing suite in its own job and names the SwiftShader still path", () => {
    expect(e2e).toContain("pnpm test:e2e");
    expect(e2e).toContain("SwiftShader");
    expect(e2e).toContain("lib/garage/capability.ts");
    expect(needs(e2e)).not.toContain("quality-gate");
  });

  it("requires that job before image and before deploy", () => {
    expect(needs(image)).toEqual(["quality-gate", "e2e"]);
    expect(needs(deploy)).toEqual(["image", "e2e"]);
  });

  it("does not turn the develop deploy into a prod cutover", () => {
    expect(deploy).toContain("github.ref == 'refs/heads/develop'");
    expect(deploy).toContain("HOST_PORT=3010");
    expect(deploy).toContain("url: https://garage.yannikwuenker.de");
    expect(deploy).not.toContain("refs/heads/master");
    expect(deploy).not.toContain("https://yannikwuenker.de");
    expect(workflow).not.toContain("the build has no data source yet");
  });
});
