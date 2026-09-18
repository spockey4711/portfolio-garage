"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { closeView } from "@/lib/garage/navigate";
import { useGarageStore } from "@/lib/garage/store";
import { viewFromSearch } from "@/lib/garage/url";

// The URL is the source of truth for which hotspot is open (KONZEPT §5).
// This is the only place the store hears about it: a deep link, a click
// (which pushed ?view=), the browser's back button and Escape all arrive
// here as a search param change. Renders nothing; mount it once per page.
export function ViewSync() {
  const search = useSearchParams();
  const focus = useGarageStore((state) => state.focus);

  useEffect(() => {
    focus(viewFromSearch(search).id);
  }, [search, focus]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (useGarageStore.getState().phase === "idle") return;
      closeView();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
