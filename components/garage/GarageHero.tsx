"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getGarageContent } from "@/content/garage";
import { SKY_COLOR } from "@/lib/garage/lightmap";
import { defaultLocale } from "@/lib/i18n";
import { HotspotNav } from "./HotspotNav";
import { ViewSync } from "./ViewSync";

// three.js needs a window, so the canvas is loaded on the client only, after
// the page has painted. Until then the hero shows the same sky the canvas
// clears to, so nothing flashes when it mounts.
const Garage = dynamic(
  () => import("./Garage").then((module) => module.Garage),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full" style={{ backgroundColor: SKY_COLOR }} />
    ),
  },
);

export function GarageHero() {
  const content = getGarageContent(defaultLocale);

  return (
    <section
      aria-label={content.heroLabel}
      className="relative h-svh w-full"
      style={{ backgroundColor: SKY_COLOR }}
    >
      <Garage />
      {/* Sits outside the canvas: the same URL sync serves the 2D fallback. */}
      <Suspense fallback={null}>
        <ViewSync />
      </Suspense>
      <HotspotNav />
    </section>
  );
}
