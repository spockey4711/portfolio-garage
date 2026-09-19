import Image from "next/image";
import { getGarageContent, type PinboardItemContent } from "@/content/garage";
import {
  itemStyle,
  PINBOARD_PX_PER_M,
  type PinboardItem,
  pinboard,
} from "@/lib/garage/pinboard";
import { defaultLocale } from "@/lib/i18n";

// The cork board of docs/KONZEPT.md §3: race numbers, photos and notes, every
// one of them a link to /ueber. The board itself is not drawn; the DOM is
// transparent and lies on the GLB's board face, so the baked cork and frame
// show through, and each item sits exactly on the paper stand-in the GLB
// carries for it (lib/garage/pinboard.ts). Plain anchors, like HotspotNav:
// leaving the garage is a page load, and they work without JavaScript.
export function Pinboard() {
  const content = getGarageContent(defaultLocale).screens.pinnwand;

  return (
    <nav
      aria-label={content.label}
      className="relative h-full w-full font-sans"
    >
      <p className="sr-only">{content.hint}</p>
      <ul>
        {pinboard.items.map((item) => (
          <li key={item.id} className="absolute" style={itemStyle(item)}>
            <a
              href={content.items[item.id].href}
              className="block h-full w-full shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-[transform,box-shadow] outline-none hover:scale-[1.04] hover:shadow-[0_4px_10px_rgba(0,0,0,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Face item={item} content={content.items[item.id]} />
            </a>
            <Pin />
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface FaceProps {
  readonly item: PinboardItem;
  readonly content: PinboardItemContent;
}

// What is printed on the item. Sizes are CSS pixels at PINBOARD_PX_PER_M,
// so a 19 cm race number is 190 px wide and its type is set for that.
function Face({ item, content }: FaceProps) {
  switch (content.kind) {
    case "startnummer":
      return (
        <span className="flex h-full w-full flex-col items-center justify-between bg-[#f4f1ea] px-3 pt-[24px] pb-2 text-zinc-900">
          <span className="text-[13px] font-medium tracking-[0.12em] uppercase">
            {content.event}
          </span>
          <span className="font-mono text-[64px] leading-none font-bold tabular-nums">
            {content.number}
          </span>
          <span aria-hidden="true" className="bg-accent h-[6px] w-full" />
        </span>
      );
    case "foto":
      return (
        <span className="flex h-full w-full flex-col bg-[#f7f5f0] p-[6px] pb-0">
          {content.src ? (
            <span className="relative min-h-0 flex-1">
              <Image
                src={content.src}
                alt={content.caption}
                fill
                sizes={`${Math.round(item.width * PINBOARD_PX_PER_M)}px`}
                className="object-cover"
              />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className={[
                "min-h-0 flex-1",
                item.width > item.height
                  ? "bg-[linear-gradient(to_bottom,#9db0ba_0%,#d3d9d3_58%,#6b7566_59%,#4a534b_100%)]"
                  : "bg-[linear-gradient(to_bottom,#9db0ba_0%,#d3d9d3_62%,#5d6a57_63%,#414a41_100%)]",
              ].join(" ")}
            />
          )}
          <span className="flex h-[18px] items-center justify-center text-[11px] text-zinc-600">
            {content.caption}
          </span>
        </span>
      );
    case "zettel":
      return (
        <span className="flex h-full w-full flex-col gap-[3px] overflow-hidden bg-[#f6f1df] px-[9px] pt-[22px] pb-[8px] break-words text-zinc-800">
          <span className="text-[13px] leading-tight font-semibold">
            {content.title}
          </span>
          {content.lines.map((line) => (
            <span key={line} className="text-[10.5px] leading-snug">
              {line}
            </span>
          ))}
        </span>
      );
  }
}

/** The pin holding the item, where the GLB's pin is: top centre, pinInset below the edge. */
function Pin() {
  const size = 10;
  return (
    <span
      aria-hidden="true"
      className="bg-accent pointer-events-none absolute left-1/2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.25)]"
      style={{
        width: size,
        height: size,
        top: pinboard.pinInset * PINBOARD_PX_PER_M - size / 2,
        marginLeft: -size / 2,
      }}
    />
  );
}
