// The transparency footer (docs/KONZEPT.md §10): real numbers about the
// build a visitor is looking at, nothing estimated. The commit is baked in
// by next.config.ts, the JavaScript per route is summed from what Next wrote
// to .next (lib/build/read.ts). Everything here is pure so it can be tested
// against fixtures; whatever cannot be established is undefined and the
// footer leaves it out.

export const REPOSITORY_URL = "https://github.com/spockey4711/portfolio-garage";

export interface Commit {
  readonly sha: string;
  /** The seven characters git and GitHub show. */
  readonly short: string;
  readonly url: string;
}

/** Bytes of JavaScript the HTML of a route loads, by route pattern ("/", "/blog/[slug]"). */
export type RouteSizes = Readonly<Record<string, number>>;

export interface BuildInfo {
  readonly commit?: Commit;
  readonly sizes?: RouteSizes;
}

/** The full SHA from the build environment, or nothing: never a placeholder. */
export function commitFromSha(sha: string | undefined): Commit | undefined {
  if (!sha || !/^[0-9a-f]{40}$/.test(sha)) return undefined;
  return {
    sha,
    short: sha.slice(0, 7),
    url: `${REPOSITORY_URL}/commit/${sha}`,
  };
}

/**
 * The app-paths-manifest key of a page ("/(seiten)/blog/[slug]/page") as the
 * pattern a pathname is matched against: route groups fall away, so does
 * the trailing "/page".
 */
export function routePattern(key: string): string {
  const segments = key
    .split("/")
    .filter((segment) => segment !== "" && !/^\(.*\)$/.test(segment));
  if (segments.at(-1) === "page") segments.pop();
  return `/${segments.join("/")}`;
}

/**
 * The client files a page's client-reference manifest lists for it. The file
 * is JavaScript, one assignment of a JSON object per route, which is parsed
 * as such rather than executed. Nothing recognisable means undefined.
 */
export function entryFilesOf(
  manifestSource: string,
  key: string,
): readonly string[] | undefined {
  const start = manifestSource.indexOf(
    "{",
    manifestSource.indexOf(`["${key}"]`),
  );
  const end = manifestSource.lastIndexOf("}");
  if (start < 0 || end < start) return undefined;
  let manifest: unknown;
  try {
    manifest = JSON.parse(manifestSource.slice(start, end + 1));
  } catch {
    return undefined;
  }
  const entries = (manifest as { entryJSFiles?: unknown }).entryJSFiles;
  if (!entries || typeof entries !== "object") return undefined;
  const files = (entries as Record<string, unknown>)[`[project]/app${key}`];
  return Array.isArray(files) && files.every((file) => typeof file === "string")
    ? files
    : undefined;
}

/**
 * What a route's HTML loads as JavaScript, in bytes: the shared runtime plus
 * the route's own entry files, each counted once. Polyfills are not in
 * either list; browsers that need them are not the audience of the number.
 */
export function firstLoadBytes(
  rootMainFiles: readonly string[],
  entryFiles: readonly string[],
  sizeOf: (file: string) => number,
): number {
  const files = new Set(
    [...rootMainFiles, ...entryFiles].filter((file) => file.endsWith(".js")),
  );
  let bytes = 0;
  for (const file of files) bytes += sizeOf(file);
  return bytes;
}

/**
 * The size for a pathname: the static pattern wins over a dynamic one, a
 * "[slug]" segment matches any one segment. No match, no number.
 */
export function sizeForPath(
  sizes: RouteSizes | undefined,
  pathname: string,
): number | undefined {
  if (!sizes) return undefined;
  const path = pathname.split("/").filter(Boolean);
  const patterns = Object.keys(sizes).sort(
    (a, b) => Number(a.includes("[")) - Number(b.includes("[")),
  );
  const match = patterns.find((pattern) => {
    const parts = pattern.split("/").filter(Boolean);
    return (
      parts.length === path.length &&
      parts.every((part, i) => /^\[.+\]$/.test(part) || part === path[i])
    );
  });
  return match === undefined ? undefined : sizes[match];
}

/** "939 kB": decimal kilobytes like the browser's network panel, no decimals. */
export function formatKilobytes(bytes: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(bytes / 1000)} kB`;
}
