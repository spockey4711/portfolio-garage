"use client";

import type { MouseEvent } from "react";
import { getGarageContent } from "@/content/garage";
import { focusViews, type View } from "@/lib/garage/hotspots";
import { closeView, openView } from "@/lib/garage/navigate";
import { useGarageStore } from "@/lib/garage/store";
import { hrefForView } from "@/lib/garage/url";
import { defaultLocale } from "@/lib/i18n";

/** A modified or non-primary click wants a new tab; leave that to the browser. */
function isPlainClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

// The keyboard and screen-reader way into the hotspots (KONZEPT §4: Tab
// walks through them, Enter focuses). Real links with the ?view= href, so
// they also work without JavaScript and are crawlable; with it, a click
// takes the shallow pushState path like a click in the scene. Focusing a
// link lights the same label in 3D that hovering the mesh does. Plus the
// button that leaves a hotspot, for pointers without an Escape key.
export function HotspotNav() {
  const content = getGarageContent(defaultLocale);
  const phase = useGarageStore((state) => state.phase);
  const hover = useGarageStore((state) => state.hover);

  const onClick = (view: View) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    openView(view);
  };

  return (
    <>
      <nav aria-label={content.navLabel} className="absolute top-4 left-4">
        <ul className="flex flex-col gap-2">
          {focusViews.map((view) => (
            <li key={view.id}>
              <a
                href={hrefForView(view)}
                onClick={onClick(view)}
                onFocus={() => hover(view.id)}
                onBlur={() => hover(null)}
                className="sr-only rounded-full bg-zinc-900/90 px-3 py-1 text-sm text-white focus:not-sr-only focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {content.hotspots[view.id].label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {(phase === "focusing" || phase === "focused") && (
        // Keyboard focus moves into the hotspot like into a dialog, so Enter on
        // a link is followed by Escape or Enter here, not by a stranded link.
        <button
          type="button"
          autoFocus
          onClick={closeView}
          className="absolute top-4 right-4 rounded-full bg-zinc-900/90 px-3 py-1 text-sm text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {content.back}
        </button>
      )}
    </>
  );
}
