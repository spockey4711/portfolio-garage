"use client";

import { getImageProps } from "next/image";
import type { MouseEvent } from "react";
import { getGarageContent } from "@/content/garage";
import type { FocusViewId, View } from "@/lib/garage/hotspots";
import { isPlainClick, openView } from "@/lib/garage/navigate";
import {
  STILL_PORTRAIT,
  STILL_WIDE,
  type StillImage,
  stillAreaOrder,
  stillAreas,
} from "@/lib/garage/still";
import { useGarageStore } from "@/lib/garage/store";
import { hrefForView } from "@/lib/garage/url";
import { defaultLocale } from "@/lib/i18n";

// The rest view as an image (docs/KONZEPT.md §5). It is the first paint of the
// hero and stays the whole picture where the canvas never mounts. object-fit:
// cover fits it by height on any viewport narrower than the still, which is
// also how the canvas frames its fixed vertical field of view, so the two
// line up. The click areas sit in an SVG with the still's frame as viewBox and
// the same "slice" fit, so the browser maps them onto the image itself; no
// script, no measuring. The links carry the same ?view= href as HotspotNav,
// which stays the keyboard and screen-reader way in; these are for pointers.
export function GarageStill() {
  const content = getGarageContent(defaultLocale);
  const wide = imageProps(STILL_WIDE, content.still.alt, "max(100vw, 240vh)");
  const portrait = imageProps(
    STILL_PORTRAIT,
    content.still.alt,
    "max(100vw, 50vh)",
  );

  return (
    <>
      <picture>
        <source
          media="(orientation: portrait)"
          srcSet={portrait.srcSet}
          sizes={portrait.sizes}
        />
        <img
          {...wide}
          alt={content.still.alt}
          className="absolute inset-0 h-full w-full object-cover select-none"
        />
      </picture>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${STILL_WIDE.width} ${STILL_WIDE.height}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {stillAreaOrder.map((view) => (
          <StillArea key={view.id} view={view} />
        ))}
      </svg>
    </>
  );
}

/**
 * The still is fitted by height whenever the viewport is narrower than it, so
 * the width the browser needs is the height times the still's aspect ratio,
 * not the viewport width; without that sizes hint it would pick a source
 * too small and upscale it.
 */
function imageProps(image: StillImage, alt: string, sizes: string) {
  return getImageProps({
    src: image.src,
    width: image.width,
    height: image.height,
    alt,
    sizes,
    priority: true,
  }).props;
}

function StillArea({ view }: { readonly view: View<FocusViewId> }) {
  const area = stillAreas[view.id];
  const label = getGarageContent(defaultLocale).hotspots[view.id].label;
  const hovered = useGarageStore((state) => state.hovered === view.id);
  const hover = useGarageStore((state) => state.hover);

  const onClick = (event: MouseEvent) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    openView(view);
  };

  return (
    <a
      href={hrefForView(view)}
      tabIndex={-1}
      onClick={onClick}
      onPointerEnter={() => hover(view.id)}
      onPointerLeave={() => hover(null)}
      className="cursor-pointer"
    >
      <title>{label}</title>
      {/* The stroke is the still's hover outline; non-scaling keeps it 2 px. */}
      <rect
        x={area.x}
        y={area.y}
        width={area.width}
        height={area.height}
        rx={8}
        fill="transparent"
        stroke="#ffffff"
        strokeWidth={hovered ? 2 : 0}
        vectorEffect="non-scaling-stroke"
      />
    </a>
  );
}
