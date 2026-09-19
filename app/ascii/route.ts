import { renderTerminalCard } from "@/lib/terminal/card";
import { defaultLocale } from "@/lib/i18n";

// The text version of the start page (docs/KONZEPT.md §10). proxy.ts rewrites
// / here for curl and friends; the path also works directly in a browser.
// Links are absolute, built from the host the request came in on: Nginx
// passes the Host header through and sets X-Forwarded-Proto (docs/BETRIEB.md).

export function GET(request: Request) {
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const card = renderTerminalCard({
    origin: `${proto}://${url.host}`,
    locale: defaultLocale,
  });
  return new Response(card, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // The same URL answers with HTML to a browser: caches must key on both.
      vary: "Accept, User-Agent",
    },
  });
}
