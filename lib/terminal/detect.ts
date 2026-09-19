// Who gets the text version of / (docs/KONZEPT.md §10, "curl yannikwuenker.de
// liefert eine ASCII-Version"): a client whose Accept header ranks text/plain
// above text/html, or a terminal HTTP client that did not ask for HTML at all.
// Browsers always name text/html first, so they never end up here; a curl with
// "-H 'Accept: text/html'" gets the page like everyone else.

/** Prefixes of the User-Agent strings the common terminal clients send. */
const terminalAgents = ["curl/", "Wget/", "HTTPie/", "xh/"];

interface MediaRange {
  readonly type: string;
  readonly subtype: string;
  readonly q: number;
}

function parseAccept(accept: string): MediaRange[] {
  return accept
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [range = "", ...params] = part
        .split(";")
        .map((piece) => piece.trim());
      const [type = "*", subtype = "*"] = range.toLowerCase().split("/");
      const qParam = params.find((param) =>
        param.toLowerCase().startsWith("q="),
      );
      const q = qParam ? Number(qParam.slice(2)) : 1;
      return { type, subtype, q: Number.isFinite(q) ? q : 0 };
    });
}

/** The quality a media type gets: the most specific matching range wins. */
function quality(ranges: readonly MediaRange[], media: string): number {
  const [type, subtype] = media.split("/");
  const exact = ranges.find((r) => r.type === type && r.subtype === subtype);
  if (exact) return exact.q;
  const partial = ranges.find((r) => r.type === type && r.subtype === "*");
  if (partial) return partial.q;
  const any = ranges.find((r) => r.type === "*" && r.subtype === "*");
  return any ? any.q : 0;
}

export function prefersText(
  userAgent: string | null,
  accept: string | null,
): boolean {
  const ranges = parseAccept(accept ?? "");
  const html = quality(ranges, "text/html");
  const plain = quality(ranges, "text/plain");
  if (plain !== html) return plain > html;
  // Equal, typically "*/*" or no header at all: an explicit text/html settles
  // it for the page, otherwise the client decides.
  if (ranges.some((r) => r.type === "text" && r.subtype === "html")) {
    return false;
  }
  return terminalAgents.some((prefix) => userAgent?.startsWith(prefix));
}
