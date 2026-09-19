import { Caveat } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { NowList } from "@/components/site/NowList";
import { TextLink } from "@/components/site/TextLink";
import { getAboutContent, type NowEntry } from "@/content/about";
import { getGarageContent } from "@/content/garage";
import { getSiteContent } from "@/content/site";
import { defaultLocale } from "@/lib/i18n";

// The whiteboard of docs/KONZEPT.md §3, since docs/adr/0008 the snapshot of
// content/about.ts in marker: who, where, what is running, where to. The
// board itself is not drawn; the DOM is transparent and lies on the white
// face inside the frame (lib/garage/hotspots.ts, display), so the baked
// light stays and only the ink is added. Sizes are CSS pixels at
// WHITEBOARD_PX_PER_M, so the 1.16 m face is 1160 px wide and the marker
// type is set for that: a name at 64 px is a hand's width tall on the wall.

/** CSS pixels per metre of board; screens/index.ts derives pxWidth from it. */
export const WHITEBOARD_PX_PER_M = 1000;

/** The white face inside the frame in metres: WW - 2 * WF by WH - 2 * WF in blender/build/build_furniture.py. */
export const WHITEBOARD_FACE_M = { width: 1.16, height: 0.86 } as const;

// A round marker script with real umlauts. Loaded here and not in the root
// layout, so only the page with the garage pays for it.
const marker = Caveat({ subsets: ["latin"], variable: "--font-marker" });

// Marker ink: never pure, and a little translucent like a real stroke. The
// blue carries headings, the red only strokes. The muted ink is the black
// thinned, not a grey: the board stands in the shade of the back wall, and
// a grey ink vanishes there.
const ink = {
  black: "text-[#23272d]/90",
  blue: "text-[#20418c]/90",
  muted: "text-[#23272d]/70",
} as const;

const RED = "rgba(190, 52, 42, 0.88)";

export function Whiteboard() {
  const content = getGarageContent(defaultLocale).screens.whiteboard;
  const now = getAboutContent(defaultLocale).now;
  const name = getSiteContent(defaultLocale).name;

  return (
    <section
      aria-label={content.label}
      className={`${marker.variable} relative h-full w-full font-[family-name:var(--font-marker)] leading-none select-none`}
    >
      {/* the name, underlined with one quick stroke */}
      <header className="absolute top-[44px] left-[56px] w-[520px] -rotate-[1.2deg]">
        <h2 className={`text-[66px] font-bold ${ink.blue}`}>{name}</h2>
        <Underline width={412} className="-mt-[6px] ml-[2px]" />
        <ul className={`mt-[14px] space-y-[6px] text-[31px] ${ink.black}`}>
          {now.who.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </header>

      {/* the date, boxed in a corner */}
      <p
        className={`absolute top-[54px] right-[64px] rotate-[1.6deg] px-[14px] py-[6px] text-[26px] ${ink.muted}`}
        style={{ boxShadow: `inset 0 0 0 2.5px ${RED}`, borderRadius: 3 }}
      >
        {now.updated}
      </p>

      {/* what is running: the list, each line ticked */}
      <div className="absolute top-[318px] left-[58px] w-[600px] -rotate-[0.6deg]">
        <h3 className={`text-[42px] font-bold ${ink.blue}`}>{now.title}</h3>
        <Underline width={300} className="-mt-[4px]" />
        <ul className="mt-[16px] space-y-[14px]">
          {now.entries.map((entry, index) => (
            <li key={entry.label} className="flex gap-[14px]">
              <Tick className="mt-[10px] shrink-0" seed={index} />
              <span className="min-w-0 leading-[1.1]">
                <span className={`text-[34px] font-bold ${ink.black}`}>
                  <EntryLabel entry={entry} />
                </span>
                <span className={`block text-[26px] ${ink.muted}`}>
                  {entry.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* where to, behind an arrow */}
      <div className="absolute top-[352px] right-[60px] w-[400px] rotate-[1.1deg]">
        <div className="flex items-center gap-[12px]">
          <h3 className={`text-[42px] font-bold ${ink.blue}`}>
            {now.next.title}
          </h3>
          <Arrow />
        </div>
        <p className={`mt-[10px] text-[31px] leading-[1.15] ${ink.black}`}>
          {now.next.text}
        </p>
      </div>

      {/* where the rest is, small in the corner */}
      <p
        className={`absolute right-[64px] bottom-[34px] rotate-[-1.4deg] text-[24px] ${ink.muted}`}
      >
        <Link
          href="/ueber"
          className="rounded-sm underline decoration-current/60 decoration-[2px] underline-offset-[5px] outline-none hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#20418c]"
        >
          {content.more}
        </Link>
      </p>
    </section>
  );
}

// The still's card (StillView.tsx): marker script scaled to a phone is a
// scrawl, so the card shows the same snapshot as /ueber, page-sized.
export function WhiteboardCard() {
  const content = getGarageContent(defaultLocale).screens.whiteboard;

  return (
    <div className="space-y-4 px-5 pb-5">
      <NowList tone="dark" />
      <p className="text-zinc-400">
        <TextLink href="/ueber">{content.more}</TextLink>
      </p>
    </div>
  );
}

// A label is a link when the entry has one. The garage is one page, so an
// internal route goes through next/link like the laptop's rows.
function EntryLabel({ entry }: { readonly entry: NowEntry }) {
  if (!entry.href) return entry.label;
  const className =
    "rounded-sm underline decoration-current/50 decoration-[2.5px] underline-offset-[6px] outline-none hover:decoration-[#be342a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#20418c]";
  return entry.href.startsWith("/") ? (
    <Link href={entry.href} className={className}>
      {entry.label}
    </Link>
  ) : (
    <a href={entry.href} className={className}>
      {entry.label}
    </a>
  );
}

// The strokes are SVG paths with a slight wobble, drawn in red like a
// second marker; a straight CSS border would read as print.

function Stroke({
  width,
  height,
  children,
  className,
}: {
  readonly width: number;
  readonly height: number;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      stroke={RED}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={["block", className ?? ""].join(" ").trim()}
    >
      {children}
    </svg>
  );
}

function Underline({
  width,
  className,
}: {
  readonly width: number;
  readonly className?: string;
}) {
  const w = width;
  return (
    <Stroke width={w} height={14} className={className}>
      <path
        d={`M3 9 C ${w * 0.2} 3, ${w * 0.45} 12, ${w * 0.7} 6 S ${w - 20} 4, ${w - 3} 8`}
        strokeWidth={3.5}
      />
    </Stroke>
  );
}

function Arrow() {
  return (
    <Stroke width={120} height={40}>
      <path d="M4 24 C 30 12, 60 30, 108 18" strokeWidth={4} />
      <path d="M90 6 L 110 18 L 92 32" strokeWidth={4} />
    </Stroke>
  );
}

// A tick per line, each a little different so the column does not repeat.
function Tick({
  seed,
  className,
}: {
  readonly seed: number;
  readonly className?: string;
}) {
  const dx = (seed % 3) * 1.5;
  const dy = (seed % 2) * 2;
  return (
    <Stroke width={30} height={26} className={className}>
      <path
        d={`M${4 + dx} ${14 + dy} L ${12 + dx} ${22} L ${27} ${4 + dy}`}
        strokeWidth={4}
      />
    </Stroke>
  );
}
