import { join } from "node:path";
import { readJsonFile, writeJsonFile } from "./json-file.ts";

// Strava OAuth for one athlete, the owner of the garage. The one-off
// authorization (scripts/strava.mts auth) writes the token file, from then
// on every API call goes through validTokens(), which refreshes the access
// token shortly before it expires. The refresh token rotates on refresh, so
// the file, not the environment, is its home (docs/adr/0002).

export const TOKEN_FILE = "strava-token.json";
export const OAUTH_URL = "https://www.strava.com/oauth";
/** Private activities included; the public API filters them out. */
export const SCOPE = "activity:read_all";
/** Refresh this long before the access token expires (seconds). */
const REFRESH_MARGIN = 300;

export interface TokenSet {
  readonly athleteId: number;
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Unix time in seconds, as Strava reports it. */
  readonly expiresAt: number;
}

export interface StravaApp {
  readonly clientId: string;
  readonly clientSecret: string;
}

export class NotAuthorizedError extends Error {
  constructor(path: string) {
    super(`No Strava token at ${path}; run "node scripts/strava.mts auth"`);
  }
}

export class OAuthError extends Error {
  readonly status: number;
  constructor(status: number, body: string) {
    super(`Strava OAuth failed with ${status}: ${body}`);
    this.status = status;
  }
}

/** The page the athlete authorizes the app on. */
export function authorizeUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "auto",
    scope: SCOPE,
  });
  return `${OAUTH_URL}/authorize?${params}`;
}

async function tokenRequest(
  app: StravaApp,
  grant: Record<string, string>,
  fetchFn: typeof fetch,
  athleteId?: number,
): Promise<TokenSet> {
  const response = await fetchFn(`${OAUTH_URL}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: app.clientId,
      client_secret: app.clientSecret,
      ...grant,
    }),
  });
  if (!response.ok) {
    throw new OAuthError(response.status, await response.text());
  }
  const body = (await response.json()) as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_at?: unknown;
    athlete?: { id?: unknown };
  };
  const id = athleteId ?? body.athlete?.id;
  if (
    typeof body.access_token !== "string" ||
    typeof body.refresh_token !== "string" ||
    typeof body.expires_at !== "number" ||
    typeof id !== "number"
  ) {
    throw new OAuthError(response.status, "unexpected token response");
  }
  return {
    athleteId: id,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_at,
  };
}

/** The authorization code from the redirect, traded for the first tokens. */
export function exchangeCode(
  app: StravaApp,
  code: string,
  fetchFn: typeof fetch = fetch,
): Promise<TokenSet> {
  return tokenRequest(app, { grant_type: "authorization_code", code }, fetchFn);
}

export function refreshTokens(
  app: StravaApp,
  tokens: TokenSet,
  fetchFn: typeof fetch = fetch,
): Promise<TokenSet> {
  return tokenRequest(
    app,
    { grant_type: "refresh_token", refresh_token: tokens.refreshToken },
    fetchFn,
    tokens.athleteId,
  );
}

export function tokenPath(dataDir: string): string {
  return join(dataDir, TOKEN_FILE);
}

export async function readTokens(dataDir: string): Promise<TokenSet> {
  const value = (await readJsonFile(
    tokenPath(dataDir),
  )) as Partial<TokenSet> | null;
  if (
    typeof value?.athleteId !== "number" ||
    typeof value.accessToken !== "string" ||
    typeof value.refreshToken !== "string" ||
    typeof value.expiresAt !== "number"
  ) {
    throw new NotAuthorizedError(tokenPath(dataDir));
  }
  return {
    athleteId: value.athleteId,
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    expiresAt: value.expiresAt,
  };
}

export function writeTokens(dataDir: string, tokens: TokenSet) {
  return writeJsonFile(tokenPath(dataDir), tokens);
}

export function isExpiring(tokens: TokenSet, now: Date): boolean {
  return tokens.expiresAt - now.getTime() / 1000 < REFRESH_MARGIN;
}

// A webhook event and the cron can hit an expiring token at the same time;
// the second caller waits for the first refresh instead of racing it with a
// refresh token that the first one just invalidated.
const refreshing = new Map<string, Promise<TokenSet>>();

/**
 * The tokens on disk, refreshed and written back when the access token is
 * about to expire.
 */
export async function validTokens(
  dataDir: string,
  app: StravaApp,
  now: Date = new Date(),
  fetchFn: typeof fetch = fetch,
): Promise<TokenSet> {
  const tokens = await readTokens(dataDir);
  if (!isExpiring(tokens, now)) return tokens;
  // Checked after the read: a caller that read the same stale file a tick
  // earlier has registered its refresh by now.
  const pending = refreshing.get(dataDir);
  if (pending) return pending;

  const refresh = refreshTokens(app, tokens, fetchFn)
    .then(async (fresh) => {
      await writeTokens(dataDir, fresh);
      return fresh;
    })
    .finally(() => refreshing.delete(dataDir));
  refreshing.set(dataDir, refresh);
  return refresh;
}
