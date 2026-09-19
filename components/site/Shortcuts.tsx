"use client";

import { usePathname } from "next/navigation";
import {
  Fragment,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";
import type { SiteContent } from "@/content/site";
import { useGarageStore } from "@/lib/garage/store";
import { isPaletteShortcut } from "@/lib/palette";
import {
  HEAD,
  isEditable,
  SECTION_ATTRIBUTE,
  sectionAfter,
  shortcutFor,
} from "@/lib/shortcuts";
import { useModifierKey } from "./useModifierKey";

// Keyboard-first (docs/KONZEPT.md §10), mounted once in the root layout:
// j and k scroll to the next and previous element marked data-section and
// move the focus to its heading, so a screen reader reads where the page
// went; ? opens this overlay, a native <dialog> like the palette. The keys
// stay quiet where they would collide: in a field, while a dialog is open
// (the palette has its own keys) and while a hotspot is open (the bike
// computer has the arrows, and scrolling away from an open hotspot is not a
// thing). Escape in here is defaultPrevented, or ViewSync.tsx would also
// leave the open hotspot.

interface ShortcutsProps {
  readonly content: SiteContent["shortcuts"];
}

export function Shortcuts({ content }: ShortcutsProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const modifier = useModifierKey();

  const close = useCallback(() => dialogRef.current?.close(), []);
  // The section the last key sent the page to, until that scroll has ended.
  const inFlight = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const shortcut = shortcutFor(event);
      if (!shortcut) return;
      if (isEditable(event.target as HTMLElement | null)) return;
      if (document.querySelector("dialog[open]")) return;
      if (useGarageStore.getState().phase !== "idle") return;
      event.preventDefault();

      if (shortcut === "help") {
        dialogRef.current?.showModal();
        return;
      }
      inFlight.current = moveTo(shortcut, inFlight.current);
    };
    // scrollend also ends a wheel or touch scroll, which likewise means the
    // position is the truth again. Safari lacks the event; there the timer,
    // longer than any smooth scroll, does the same a moment later.
    let timer: number | undefined;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (inFlight.current = null), IN_FLIGHT_MS);
    };
    const onScrollEnd = () => {
      window.clearTimeout(timer);
      inFlight.current = null;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.clearTimeout(timer);
    };
  }, []);

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    // The palette wins: the overlay steps aside and lets its listener open it.
    if (isPaletteShortcut(event)) {
      close();
      return;
    }
    if (event.key !== "Escape" && event.key !== "?") return;
    event.preventDefault();
    close();
  };

  const items = content.items.filter(
    (item) => item.scope !== "garage" || pathname === "/",
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onKeyDown={onDialogKeyDown}
      onClick={(event) => {
        // The backdrop is the dialog itself outside its content box.
        if (event.target === event.currentTarget) close();
      }}
      // Nothing inside takes the focus, so the dialog itself has it; the
      // modal needs no ring on top of its backdrop to show that.
      className="bg-background text-foreground fixed inset-x-0 top-[12vh] m-0 mx-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-zinc-200 p-0 shadow-2xl outline-none backdrop:bg-zinc-950/40 dark:border-zinc-700 dark:backdrop:bg-black/60"
    >
      <div className="px-5 py-5">
        <h2
          id={titleId}
          className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase"
        >
          {content.label}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {content.intro}
        </p>
        <dl className="mt-5 grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-3 text-sm">
          {items.map((item) => (
            <Fragment key={item.text}>
              <dt className="flex gap-1">
                {(item.modifier ? [modifier, ...item.keys] : item.keys).map(
                  (key) => (
                    <kbd
                      key={key}
                      className="min-w-6 rounded border border-zinc-300 px-1.5 py-0.5 text-center font-mono text-[11px] leading-none text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                    >
                      {key}
                    </kbd>
                  ),
                )}
              </dt>
              <dd className="text-zinc-600 dark:text-zinc-400">{item.text}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </dialog>
  );
}

/** Without scrollend, a scroll counts as over this long after its last scroll event. */
const IN_FLIGHT_MS = 200;

/**
 * Scroll to the section j or k asks for and hand the focus to its heading.
 * Returns where the page is now heading, in flight until the scroll ends:
 * that section, HEAD for the top of the page, or where it was heading before
 * when there is nothing further.
 */
function moveTo(
  direction: "next" | "prev",
  inFlight: number | null,
): number | null {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>(`[${SECTION_ATTRIBUTE}]`),
  );
  const behavior: ScrollBehavior = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches
    ? "auto"
    : "smooth";
  const index = sectionAfter(
    sections.map((section) => section.getBoundingClientRect().top),
    direction,
    inFlight,
  );
  if (index === null) {
    if (direction === "next") return inFlight;
    // Above the first section is the page's head; k goes there.
    window.scrollTo({ top: 0, behavior });
    return HEAD;
  }
  const section = sections[index];
  // The heading that labels the section takes the focus; a section labelled
  // by text alone (the hero) takes it itself. Both carry tabIndex -1.
  const labelId = section.getAttribute("aria-labelledby");
  const target = (labelId && document.getElementById(labelId)) || section;
  target.focus({ preventScroll: true });
  section.scrollIntoView({ behavior, block: "start" });
  return index;
}
