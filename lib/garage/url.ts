import { type View, viewFromSlug } from "./hotspots";

// The URL is the source of truth for which hotspot is open (docs/KONZEPT.md
// §5): a click writes ?view=, the store follows the URL. Both directions go
// through these two functions.

export const VIEW_PARAM = "view";

/** The view a URL points at; no or an unknown ?view= means the rest view. */
export function viewFromSearch(search: URLSearchParams): View {
  return viewFromSlug(search.get(VIEW_PARAM));
}

/**
 * The href that opens `view`, keeping any other search params. The rest
 * view drops the param instead of writing an empty one.
 */
export function hrefForView(
  view: View,
  search: URLSearchParams = new URLSearchParams(),
  pathname = "/",
): string {
  const next = new URLSearchParams(search);
  if (view.slug === null) next.delete(VIEW_PARAM);
  else next.set(VIEW_PARAM, view.slug);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
