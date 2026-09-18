import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { readCache } from "../lib/strava/cache.ts";
import { dataDir, stravaApp, stravaVerifyToken } from "../lib/strava/env.ts";
import { summarize } from "../lib/strava/summary.ts";
import { syncRecent } from "../lib/strava/sync.ts";
import {
  authorizeUrl,
  exchangeCode,
  SCOPE,
  tokenPath,
  writeTokens,
} from "../lib/strava/token.ts";
import {
  createSubscription,
  deleteSubscription,
  listSubscriptions,
} from "../lib/strava/webhook.ts";

// The one-off and by-hand parts of the Strava integration (docs/BETRIEB.md,
// "Strava"). Runs on plain Node like optimize-glb.mts, reads .env itself.
//
//   node scripts/strava.mts auth                  authorize once, write the token file
//   node scripts/strava.mts subscribe <url>       create the webhook subscription
//   node scripts/strava.mts unsubscribe           delete every subscription of the app
//   node scripts/strava.mts sync                  pull recent activities into the cache
//   node scripts/strava.mts summary               print what /api/activity would serve

const AUTH_PORT = 8721;

/** Runs a local redirect target once and resolves with the code Strava sends. */
function receiveCode(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", `http://localhost:${port}`);
      const code = url.searchParams.get("code");
      const scope = url.searchParams.get("scope") ?? "";
      const problem = url.searchParams.get("error")
        ? `Strava meldet: ${url.searchParams.get("error")}`
        : !code
          ? "Kein Code in der Antwort."
          : !scope.includes(SCOPE)
            ? `Scope ${SCOPE} wurde nicht erteilt (bekommen: ${scope}).`
            : null;
      response.writeHead(problem ? 400 : 200, {
        "content-type": "text/plain; charset=utf-8",
      });
      response.end(problem ?? "Fertig, das Fenster kann zu.");
      server.close();
      if (problem || !code) reject(new Error(problem ?? "no code"));
      else resolve(code);
    });
    server.listen(port, "127.0.0.1");
  });
}

async function auth() {
  const app = stravaApp();
  const redirect = `http://localhost:${AUTH_PORT}/callback`;
  console.log("Im Browser öffnen und die Garage freigeben:\n");
  console.log(`  ${authorizeUrl(app.clientId, redirect)}\n`);
  console.log(
    `(Die App bei Strava braucht "localhost" als Authorization Callback Domain.)`,
  );
  const code = await receiveCode(AUTH_PORT);
  const tokens = await exchangeCode(app, code);
  await writeTokens(dataDir(), tokens);
  console.log(
    `Token für Athlet ${tokens.athleteId} liegt in ${tokenPath(dataDir())}.`,
  );
}

async function subscribe(callbackUrl: string | undefined) {
  if (!callbackUrl) throw new Error("subscribe braucht die Callback-URL");
  const app = stravaApp();
  const existing = await listSubscriptions(app);
  for (const sub of existing) {
    if (sub.callbackUrl === callbackUrl) {
      console.log(`Subscription ${sub.id} auf ${callbackUrl} gibt es schon.`);
      return;
    }
    console.log(
      `Subscription ${sub.id} zeigt auf ${sub.callbackUrl}, wird gelöscht.`,
    );
    await deleteSubscription(app, sub.id);
  }
  const id = await createSubscription(app, callbackUrl, stravaVerifyToken());
  console.log(`Subscription ${id} auf ${callbackUrl} angelegt.`);
}

async function unsubscribe() {
  const app = stravaApp();
  const existing = await listSubscriptions(app);
  if (existing.length === 0) console.log("Keine Subscription vorhanden.");
  for (const sub of existing) {
    await deleteSubscription(app, sub.id);
    console.log(`Subscription ${sub.id} gelöscht.`);
  }
}

async function sync() {
  const report = await syncRecent({ dataDir: dataDir(), app: stravaApp() });
  console.log(
    `${report.fetched} Aktivitäten von Strava geholt, ${report.total} im Cache.`,
  );
}

async function summary() {
  console.log(JSON.stringify(summarize(await readCache(dataDir())), null, 2));
}

async function main(command: string | undefined, arg: string | undefined) {
  if (existsSync(".env")) process.loadEnvFile(".env");
  switch (command) {
    case "auth":
      return auth();
    case "subscribe":
      return subscribe(arg);
    case "unsubscribe":
      return unsubscribe();
    case "sync":
      return sync();
    case "summary":
      return summary();
    default:
      throw new Error(
        "Befehl: auth | subscribe <callback-url> | unsubscribe | sync | summary",
      );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv[2], process.argv[3]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
