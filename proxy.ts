import { NextResponse, type NextRequest } from "next/server";
import { prefersText } from "@/lib/terminal/detect";

// "curl yannikwuenker.de" gets the text card (docs/KONZEPT.md §10): a
// terminal client asking for / is rewritten to app/ascii/route.ts, the URL
// stays the same. Only the start page is negotiated; the deep pages are HTML
// for everyone. The matcher keeps this off every other request.

export function proxy(request: NextRequest) {
  const { headers } = request;
  if (prefersText(headers.get("user-agent"), headers.get("accept"))) {
    return NextResponse.rewrite(new URL("/ascii", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
