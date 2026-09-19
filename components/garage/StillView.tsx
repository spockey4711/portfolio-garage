"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGarageContent } from "@/content/garage";
import {
  isFocusView,
  isScreenView,
  type ScreenViewId,
  views,
} from "@/lib/garage/hotspots";
import { closeView } from "@/lib/garage/navigate";
import { isDriving, useGarageStore } from "@/lib/garage/store";
import { defaultLocale } from "@/lib/i18n";
import { screens } from "./screens";

// The open hotspot without a camera: where the still stands in for the
// canvas, ?view= still opens the same state (URL first, KONZEPT §5), and this
// shows it as a card over the image, with the screen a device would show
// (or, where the screen has one, its page-sized card) or, for a hotspot that
// has no 2D content yet, a note. HotspotNav's back button
// and ViewSync's Escape close it like in 3D; so does a click beside the card.
export function StillView() {
  const phase = useGarageStore((state) => state.phase);
  const viewId = useGarageStore((state) => state.view);
  const arrive = useGarageStore((state) => state.arrive);
  const content = getGarageContent(defaultLocale);

  // There is no drive to wait for: a focusing or leaving store has arrived.
  useEffect(() => {
    if (isDriving(phase)) arrive();
  }, [arrive, phase]);

  const view = views[viewId];
  if (phase !== "focused" || !isFocusView(view.id)) return null;
  const label = content.hotspots[view.id].label;
  const spec = isScreenView(view) ? screens[view.id] : null;
  // A scaled screen card is as wide as fits, but never taller than the hero
  // minus the space around it (pt-16 + p-4 + the card's own heading), so the
  // bike computer's upright display fits a phone as a whole.
  const maxWidth =
    spec && !spec.Card
      ? `min(32rem, calc((100svh - 8rem) * ${spec.aspect}))`
      : undefined;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 p-4 pt-16"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeView();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="still-view-title"
        className="w-full max-w-lg overflow-hidden rounded-xl bg-zinc-900 text-white shadow-2xl"
        style={{ maxWidth }}
      >
        <h2
          id="still-view-title"
          className="px-5 py-3 text-sm font-medium text-zinc-300"
        >
          {label}
        </h2>
        {spec?.Card ? (
          <spec.Card />
        ) : isScreenView(view) ? (
          <ScaledScreen viewId={view.id} />
        ) : (
          <p className="px-5 pb-5 text-zinc-400">{content.still.comingSoon}</p>
        )}
      </section>
    </div>
  );
}

// The screen components are laid out in fixed CSS pixels for their display
// (screens/index.ts), so the card scales them down as a whole instead of
// letting their text wrap.
function ScaledScreen({ viewId }: { readonly viewId: ScreenViewId }) {
  const { Component, pxWidth, aspect, backdrop } = screens[viewId];
  const pxHeight = Math.round(pxWidth / aspect);
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = width / pxWidth;

  return (
    <div
      ref={ref}
      className={["w-full overflow-hidden", backdrop ?? ""].join(" ").trim()}
      style={{ aspectRatio: aspect }}
    >
      <div
        style={{
          width: pxWidth,
          height: pxHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          visibility: width === 0 ? "hidden" : "visible",
        }}
      >
        <Component />
      </div>
    </div>
  );
}
