import { REST_VIEW, type View, views } from "./hotspots";
import { hrefForView } from "./url";

// Opening and closing a hotspot are URL changes; ViewSync.tsx turns them into
// store transitions. Native pushState is what Next.js documents for shallow
// URL updates: its router picks the change up (useSearchParams re-renders)
// without fetching anything, so the camera starts on the same frame. Every
// open and close is a history entry, so the browser's back button always
// undoes the last step, whether it was a click or an Escape.

export function openView(view: View): void {
  const { pathname, search } = window.location;
  const href = hrefForView(view, new URLSearchParams(search), pathname);
  if (href === pathname + search) return;
  window.history.pushState(null, "", href);
}

export function closeView(): void {
  openView(views[REST_VIEW]);
}
