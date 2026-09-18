"use client";

import { useState } from "react";
import { getGarageContent } from "@/content/garage";
import { useGarageStore } from "@/lib/garage/store";
import { defaultLocale } from "@/lib/i18n";

interface GarageStatusProps {
  /** The canvas is mounting behind the still and has not drawn yet. */
  readonly loading: boolean;
  /** The hero has settled on still or canvas; before that it says nothing. */
  readonly ready: boolean;
}

// One line at the bottom edge of the hero. While the canvas fetches the
// model, the still is the whole picture and looks finished, so this is the
// only sign that something is on its way (no preloader in front of the page,
// KONZEPT §1). Once the scene can be clicked it turns into the one hint the
// garage gives, until the first hotspot opens; after that the visitor knows.
// A live region that exists from the start, so the swap is announced.
export function GarageStatus({ loading, ready }: GarageStatusProps) {
  const content = getGarageContent(defaultLocale);
  const phase = useGarageStore((state) => state.phase);
  const [visited, setVisited] = useState(false);
  if (phase !== "idle" && !visited) setVisited(true);

  const message = loading
    ? content.status.loading
    : ready && !visited
      ? content.status.hint
      : null;

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
    >
      {message && (
        <p
          key={message}
          className="motion-safe:animate-appear flex items-center gap-2 rounded-full bg-zinc-900/90 px-3 py-1 text-sm text-white"
        >
          {loading && (
            <span
              aria-hidden="true"
              className="bg-accent size-2 rounded-full motion-safe:animate-pulse"
            />
          )}
          {message}
        </p>
      )}
    </div>
  );
}
