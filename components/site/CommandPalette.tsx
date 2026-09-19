"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { SiteContent } from "@/content/site";
import { viewFromSlug } from "@/lib/garage/hotspots";
import { openView } from "@/lib/garage/navigate";
import { VIEW_PARAM } from "@/lib/garage/url";
import {
  type Command,
  commandGroups,
  filterCommands,
  isPaletteShortcut,
} from "@/lib/palette";
import { useModifierKey } from "./useModifierKey";

// cmd+K from anywhere, or the button in the header: a native <dialog> with
// a search field over the list lib/palette.ts builds. The list is a listbox
// the field drives (arrows, Enter), so the focus never leaves the field and
// a screen reader hears the selected option through aria-activedescendant.
// Escape is handled here and marked as such: ViewSync.tsx listens for it on
// the window to leave a hotspot, and a closing palette is not that.

interface CommandPaletteProps {
  readonly content: SiteContent["palette"];
  readonly commands: readonly Command[];
}

/** How long the "copied" state shows before the palette closes. */
const COPIED_MS = 900;

export function CommandPalette({ content, commands }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const modifier = useModifierKey();

  const results = filterCommands(query, commands);
  const selected = results[Math.min(active, results.length - 1)];

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    setActive(0);
    setCopiedId(null);
    dialog.showModal();
    inputRef.current?.focus();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || !isPaletteShortcut(event)) return;
      event.preventDefault();
      if (dialogRef.current?.open) close();
      else open();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const run = (command: Command) => {
    switch (command.kind) {
      case "link": {
        const url = new URL(command.href, window.location.href);
        const slug = url.searchParams.get(VIEW_PARAM);
        close();
        // A hotspot on the start page takes the shallow path a click in the
        // scene takes, and the page scrolls up so the drive is on screen.
        if (slug !== null && url.pathname === "/" && pathname === "/") {
          window.scrollTo(0, 0);
          openView(viewFromSlug(slug));
        } else {
          router.push(command.href);
        }
        return;
      }
      case "download": {
        const anchor = document.createElement("a");
        anchor.href = command.href;
        anchor.download = "";
        anchor.click();
        close();
        return;
      }
      case "copy": {
        navigator.clipboard
          .writeText(command.value)
          .then(() => {
            setCopiedId(command.id);
            window.setTimeout(close, COPIED_MS);
          })
          .catch(() => {
            // No clipboard (insecure context, denied): the mail client is
            // the next best thing.
            close();
            window.location.assign(`mailto:${command.value}`);
          });
        return;
      }
    }
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((current) =>
          results.length === 0 ? 0 : (current + 1) % results.length,
        );
        return;
      case "ArrowUp":
        event.preventDefault();
        setActive((current) =>
          results.length === 0
            ? 0
            : (current - 1 + results.length) % results.length,
        );
        return;
      case "Enter":
        event.preventDefault();
        if (selected) run(selected);
        return;
    }
  };

  // Escape closes the palette wherever the focus sits inside it, and says so
  // (defaultPrevented), or ViewSync.tsx would also leave the open hotspot.
  const onDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    close();
  };

  const optionId = (position: number) => `${listId}-${position}`;
  const activeId = selected ? optionId(results.indexOf(selected)) : undefined;

  useEffect(() => {
    if (!activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  // The list is grouped for the eye; the index the arrows move is flat.
  const groups = commandGroups
    .map((group) => ({
      group,
      commands: results.filter((command) => command.group === group),
    }))
    .filter((entry) => entry.commands.length > 0);

  return (
    <>
      {/* Not on a phone: the header has no room for it there and the
          shortcut is a keyboard feature; the shortcut itself works anywhere. */}
      <button
        type="button"
        onClick={open}
        className="focus-visible:outline-accent hidden items-center gap-2 rounded-sm text-sm text-zinc-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 sm:flex dark:text-zinc-400"
      >
        {content.label}
        <kbd
          aria-hidden="true"
          className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-[11px] leading-none text-zinc-500 dark:border-zinc-700"
        >
          {modifier} K
        </kbd>
      </button>
      <dialog
        ref={dialogRef}
        aria-label={content.label}
        onClose={() => setQuery("")}
        onKeyDown={onDialogKeyDown}
        onClick={(event) => {
          // The backdrop is the dialog itself outside its content box.
          if (event.target === event.currentTarget) close();
        }}
        className="bg-background text-foreground fixed inset-x-0 top-[12vh] m-0 mx-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-zinc-200 p-0 shadow-2xl backdrop:bg-zinc-950/40 dark:border-zinc-700 dark:backdrop:bg-black/60"
      >
        <div className="flex flex-col">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label={content.label}
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            placeholder={content.placeholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            className="w-full border-b border-zinc-200 bg-transparent px-4 py-3 text-base outline-none placeholder:text-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-600"
          />
          <div
            id={listId}
            role="listbox"
            aria-label={content.label}
            className="max-h-[60vh] overflow-y-auto py-2"
          >
            {results.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                {content.empty}
              </p>
            )}
            {groups.map((entry) => (
              <div
                key={entry.group}
                role="group"
                aria-label={content.groups[entry.group]}
              >
                <div
                  aria-hidden="true"
                  className="px-4 pt-3 pb-1 font-mono text-[11px] tracking-[0.2em] text-zinc-500 uppercase"
                >
                  {content.groups[entry.group]}
                </div>
                {entry.commands.map((command) => {
                  const position = results.indexOf(command);
                  const isSelected = command === selected;
                  const copied = copiedId === command.id;
                  return (
                    <div
                      key={command.id}
                      id={optionId(position)}
                      role="option"
                      aria-selected={isSelected}
                      onMouseMove={() => setActive(position)}
                      onClick={() => run(command)}
                      className={`mx-2 flex cursor-pointer flex-col gap-0.5 rounded-md px-2 py-2 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 ${
                        isSelected ? "bg-zinc-100 dark:bg-zinc-800" : ""
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        {copied ? content.copyMail.done : command.label}
                      </span>
                      {command.hint && (
                        <span className="truncate text-xs text-zinc-500 sm:max-w-[50%] sm:shrink-0">
                          {command.hint}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
