"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { getGarageContent } from "@/content/garage";
import { SKY_COLOR } from "@/lib/garage/lightmap";
import { defaultLocale } from "@/lib/i18n";
import { GarageStill } from "./GarageStill";
import { HotspotNav } from "./HotspotNav";
import { StillView } from "./StillView";
import { useGarageMode } from "./useGarageMode";
import { ViewSync } from "./ViewSync";

// three.js needs a window and is only requested once the hero has painted
// and the device has qualified (useGarageMode), so the chunk never loads
// where the still is the whole picture.
const Garage = dynamic(
  () => import("./Garage").then((module) => module.Garage),
  { ssr: false },
);

// The hero is a stack (docs/KONZEPT.md §5): the rendered rest view at the
// bottom, first paint on every device; the canvas over it where the device
// can afford one, faded in once it has drawn the same view; the 2D stand-in
// for an open hotspot where it cannot. URL sync and the hotspot links sit
// outside the canvas and serve both.
export function GarageHero() {
  const content = getGarageContent(defaultLocale);
  const mode = useGarageMode();
  const [canvasDrawn, setCanvasDrawn] = useState(false);

  return (
    <section
      aria-label={content.heroLabel}
      className="relative h-svh w-full overflow-hidden"
      style={{ backgroundColor: SKY_COLOR }}
    >
      <GarageStill />
      {mode === "canvas" && (
        // Until the canvas has drawn, clicks fall through to the still's
        // areas; they push the same ?view=, and the rig drives there on load.
        <div
          className={`absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${
            canvasDrawn ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <Garage onReady={() => setCanvasDrawn(true)} />
        </div>
      )}
      {mode === "still" && <StillView />}
      <Suspense fallback={null}>
        <ViewSync />
      </Suspense>
      <HotspotNav />
    </section>
  );
}
