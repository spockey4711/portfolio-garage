import {
  getRewrittenUrl,
  isRewrite,
  // The docs call it unstable_doesProxyMatch; 16.3 still exports this name.
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";
import { config, proxy } from "./proxy";

// The negotiation itself is covered in lib/terminal/detect.test.ts; this
// checks the wiring: which paths the proxy runs on and where curl ends up.

function request(path: string, headers: Record<string, string>) {
  return new NextRequest(`https://yannikwuenker.de${path}`, { headers });
}

describe("proxy", () => {
  it("runs on the start page only", () => {
    const matches = (url: string) =>
      unstable_doesMiddlewareMatch({ config, nextConfig, url });
    expect(matches("/")).toBe(true);
    expect(matches("/?view=laptop")).toBe(true);
    expect(matches("/ueber")).toBe(false);
    expect(matches("/projekte/fuelivo")).toBe(false);
    expect(matches("/api/activity")).toBe(false);
  });

  it("rewrites curl to the text card and keeps the query out of it", () => {
    const response = proxy(
      request("/?view=laptop", { "user-agent": "curl/8.7.1" }),
    );
    expect(isRewrite(response)).toBe(true);
    expect(getRewrittenUrl(response)).toBe("https://yannikwuenker.de/ascii");
  });

  it("lets a browser through", () => {
    const response = proxy(
      request("/", {
        "user-agent": "Mozilla/5.0",
        accept: "text/html,*/*;q=0.8",
      }),
    );
    expect(isRewrite(response)).toBe(false);
  });
});
