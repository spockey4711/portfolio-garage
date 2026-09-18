import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ATHLETE_ID, fakeFetch, json, tokens } from "./fixtures";
import {
  authorizeUrl,
  exchangeCode,
  isExpiring,
  NotAuthorizedError,
  OAuthError,
  OAUTH_URL,
  readTokens,
  SCOPE,
  validTokens,
  writeTokens,
} from "./token";

const app = { clientId: "42", clientSecret: "s3cret" };

describe("authorizeUrl", () => {
  it("asks for the private activities and sends the athlete back to us", () => {
    const url = new URL(authorizeUrl("42", "http://localhost:8721/callback"));
    expect(url.origin + url.pathname).toBe(`${OAUTH_URL}/authorize`);
    expect(url.searchParams.get("client_id")).toBe("42");
    expect(url.searchParams.get("scope")).toBe(SCOPE);
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:8721/callback",
    );
  });
});

describe("exchangeCode", () => {
  it("posts the code with the app's credentials and reads the token set", async () => {
    let sent: unknown;
    const { fetchFn } = fakeFetch({
      [`${OAUTH_URL}/token`]: (_url, init) => {
        sent = JSON.parse(String(init?.body));
        return json({
          token_type: "Bearer",
          access_token: "a",
          refresh_token: "r",
          expires_at: 1_800_000_000,
          expires_in: 21600,
          athlete: { id: ATHLETE_ID },
        });
      },
    });
    expect(await exchangeCode(app, "the-code", fetchFn)).toEqual({
      athleteId: ATHLETE_ID,
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 1_800_000_000,
    });
    expect(sent).toEqual({
      client_id: "42",
      client_secret: "s3cret",
      grant_type: "authorization_code",
      code: "the-code",
    });
  });

  it("reports a refused code", async () => {
    const { fetchFn } = fakeFetch({
      [`${OAUTH_URL}/token`]: () => json({ message: "Bad Request" }, 400),
    });
    await expect(exchangeCode(app, "x", fetchFn)).rejects.toThrow(OAuthError);
  });
});

describe("isExpiring", () => {
  it("is true within five minutes of expiry", () => {
    const at = (seconds: number) => new Date(seconds * 1000);
    expect(isExpiring(tokens, at(tokens.expiresAt - 3600))).toBe(false);
    expect(isExpiring(tokens, at(tokens.expiresAt - 299))).toBe(true);
    expect(isExpiring(tokens, at(tokens.expiresAt + 1))).toBe(true);
  });
});

describe("validTokens", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "garage-token-"));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  const fresh = new Date((tokens.expiresAt - 3600) * 1000);
  const stale = new Date((tokens.expiresAt - 60) * 1000);

  it("fails with a hint before the first authorization", async () => {
    await expect(readTokens(dir)).rejects.toThrow(NotAuthorizedError);
  });

  it("returns the file untouched while the access token is good", async () => {
    await writeTokens(dir, tokens);
    const { fetchFn, calls } = fakeFetch({});
    expect(await validTokens(dir, app, fresh, fetchFn)).toEqual(tokens);
    expect(calls).toEqual([]);
  });

  it("refreshes an expiring token and writes the rotated refresh token", async () => {
    await writeTokens(dir, tokens);
    let sent: unknown;
    const { fetchFn } = fakeFetch({
      [`${OAUTH_URL}/token`]: (_url, init) => {
        sent = JSON.parse(String(init?.body));
        return json({
          access_token: "access-2",
          refresh_token: "refresh-2",
          expires_at: tokens.expiresAt + 21600,
          expires_in: 21600,
        });
      },
    });
    const refreshed = await validTokens(dir, app, stale, fetchFn);
    expect(sent).toMatchObject({
      grant_type: "refresh_token",
      refresh_token: "refresh-1",
    });
    expect(refreshed.accessToken).toBe("access-2");
    expect(refreshed.athleteId).toBe(ATHLETE_ID);
    expect(await readTokens(dir)).toEqual(refreshed);
  });

  it("refreshes once for callers that arrive together", async () => {
    await writeTokens(dir, tokens);
    const { fetchFn, calls } = fakeFetch({
      [`${OAUTH_URL}/token`]: () =>
        json({
          access_token: "access-2",
          refresh_token: "refresh-2",
          expires_at: tokens.expiresAt + 21600,
        }),
    });
    const [a, b] = await Promise.all([
      validTokens(dir, app, stale, fetchFn),
      validTokens(dir, app, stale, fetchFn),
    ]);
    expect(calls).toHaveLength(1);
    expect(a).toEqual(b);
  });
});
