import { describe, expect, it } from "vitest";
import { prefersText } from "./detect";

const chromeAccept =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

describe("prefersText", () => {
  it("is false for a browser", () => {
    expect(
      prefersText("Mozilla/5.0 (Macintosh) Chrome/130", chromeAccept),
    ).toBe(false);
  });

  it("is true for curl, wget, httpie and xh with their default Accept", () => {
    for (const agent of [
      "curl/8.7.1",
      "Wget/1.24.5",
      "HTTPie/3.2.2",
      "xh/0.22",
    ]) {
      expect(prefersText(agent, "*/*"), agent).toBe(true);
    }
  });

  it("is true for curl without an Accept header", () => {
    expect(prefersText("curl/8.7.1", null)).toBe(true);
  });

  it("is false for curl that asks for HTML", () => {
    expect(prefersText("curl/8.7.1", "text/html")).toBe(false);
    expect(prefersText("curl/8.7.1", "text/html, */*;q=0.5")).toBe(false);
  });

  it("is true for any client that ranks text/plain above text/html", () => {
    expect(prefersText("node", "text/plain")).toBe(true);
    expect(prefersText("Mozilla/5.0", "text/plain, text/html;q=0.5")).toBe(
      true,
    );
  });

  it("is false for an unknown client with a wildcard Accept", () => {
    expect(prefersText("node", "*/*")).toBe(false);
    expect(prefersText(null, null)).toBe(false);
  });

  it("treats text/* as a tie and lets the agent decide", () => {
    expect(prefersText("curl/8.7.1", "text/*")).toBe(true);
    expect(prefersText("node", "text/*")).toBe(false);
  });

  it("reads a malformed q value as zero", () => {
    expect(prefersText("curl/8.7.1", "text/html;q=abc, */*")).toBe(true);
  });
});
