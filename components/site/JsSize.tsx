"use client";

import { usePathname } from "next/navigation";
import {
  formatKilobytes,
  type RouteSizes,
  sizeForPath,
} from "@/lib/build/info";

// The JS figure of the transparency row. The footer sits in the root layout,
// which on the server does not know the route it is rendered for, so the
// server hands over the sizes of all routes (a dozen numbers) and the client
// picks its own by pathname. Prerendering runs this with the route's
// pathname, so the number is in the static HTML, not filled in later.
export function JsSize({
  sizes,
  label,
  hint,
  locale,
}: {
  readonly sizes: RouteSizes | undefined;
  readonly label: string;
  readonly hint: string;
  readonly locale: string;
}) {
  const bytes = sizeForPath(sizes, usePathname());
  if (bytes === undefined) return null;

  return (
    <div className="flex gap-1">
      <dt>{label}</dt>
      <dd title={hint}>{formatKilobytes(bytes, locale)}</dd>
    </div>
  );
}
