import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  type BuildInfo,
  commitFromSha,
  entryFilesOf,
  firstLoadBytes,
  type RouteSizes,
  routePattern,
} from "./info";

// Server side of the transparency footer: reads what next build left in
// .next. The pages are prerendered, so this runs inside the build, after
// Turbopack has written the chunks and manifests and before the HTML: the
// numbers in the HTML are the numbers of that very build. In next dev there
// is no such output (and a stale one from an earlier build must not count),
// so the sizes stay undefined there. Inside the build a missing or
// unreadable manifest throws: Next changing its output must fail the gate,
// not silently drop the number.

const DIST_DIR = ".next";

let cached: BuildInfo | undefined;

export function readBuildInfo(): BuildInfo {
  cached ??= {
    commit: commitFromSha(process.env.COMMIT_SHA),
    sizes: readSizes(),
  };
  return cached;
}

function readSizes(): RouteSizes | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  try {
    return sizesFromDist(join(process.cwd(), DIST_DIR));
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      throw new Error(
        `Transparenz-Footer: JS-Größe aus ${DIST_DIR} nicht lesbar (lib/build/read.ts)`,
        { cause: error },
      );
    }
    return undefined;
  }
}

function sizesFromDist(dist: string): RouteSizes {
  const { rootMainFiles } = readJson<{ rootMainFiles: readonly string[] }>(
    join(dist, "build-manifest.json"),
  );
  const appPaths = readJson<Record<string, string>>(
    join(dist, "server", "app-paths-manifest.json"),
  );
  const sizeOf = (file: string) => statSync(join(dist, file)).size;
  const sizes: Record<string, number> = {};
  for (const key of Object.keys(appPaths)) {
    // Only pages; Next's own (/_not-found, /_global-error) have no pathname
    // a visitor is on, and the latter is not even in the app tree.
    if (!key.endsWith("/page") || key.startsWith("/_")) continue;
    const source = readFileSync(
      join(dist, "server", "app", `${key}_client-reference-manifest.js`),
      "utf8",
    );
    const entryFiles = entryFilesOf(source, key);
    if (!entryFiles) throw new Error(`Kein entryJSFiles-Eintrag für ${key}`);
    sizes[routePattern(key)] = firstLoadBytes(
      rootMainFiles,
      entryFiles,
      sizeOf,
    );
  }
  return sizes;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}
