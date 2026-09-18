// Runtime configuration for the Strava sync (docs/adr/0002): the app keys
// and secrets come from the environment, the mutable state (token, cache)
// lives in DATA_DIR, a Docker volume on the server and ./data in dev.
// Every value is read on use, not at import, so a route that never touches
// Strava does not need the keys and a missing one fails with its name.

// No parameter properties in the classes here: Node runs these files as
// plain TypeScript for scripts/strava.mts and only strips types.
export class MissingEnvError extends Error {
  readonly variable: string;
  constructor(variable: string) {
    super(`Environment variable ${variable} is not set`);
    this.variable = variable;
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new MissingEnvError(name);
  return value;
}

/** Where the token file and the activity cache live. */
export function dataDir(): string {
  return process.env.DATA_DIR || "data";
}

/** Client ID and secret of the Strava API application. */
export function stravaApp(): { clientId: string; clientSecret: string } {
  return {
    clientId: required("STRAVA_CLIENT_ID"),
    clientSecret: required("STRAVA_CLIENT_SECRET"),
  };
}

/** The string Strava echoes back when it validates the webhook callback. */
export function stravaVerifyToken(): string {
  return required("STRAVA_VERIFY_TOKEN");
}

/** Bearer secret the host cron sends to POST /api/strava/sync. */
export function stravaSyncSecret(): string {
  return required("STRAVA_SYNC_SECRET");
}
