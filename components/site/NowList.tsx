import { TextLink } from "@/components/site/TextLink";
import { getAboutContent } from "@/content/about";
import { defaultLocale } from "@/lib/i18n";

interface NowListProps {
  /**
   * "page" follows the colour scheme like the rest of the page; "dark" is
   * for the still's card (components/garage/StillView.tsx), which is dark in
   * both schemes.
   */
  readonly tone?: "page" | "dark";
}

const tones: Readonly<
  Record<NonNullable<NowListProps["tone"]>, { muted: string; strong: string }>
> = {
  page: {
    muted: "text-zinc-600 dark:text-zinc-400",
    strong: "text-foreground",
  },
  dark: {
    muted: "text-zinc-400",
    strong: "text-zinc-100",
  },
};

// The snapshot of content/about.ts as a list: the entries with their state,
// then where it is going. /ueber prints it as a section, the still's card
// shows the same list where the garage would show the whiteboard.
export function NowList({ tone = "page" }: NowListProps) {
  const now = getAboutContent(defaultLocale).now;
  const colours = tones[tone];

  return (
    <div className="space-y-4">
      <p className="font-mono text-xs text-zinc-500">{now.updated}</p>
      <ul className="space-y-3">
        {now.entries.map((entry) => (
          <li key={entry.label}>
            <p className={`font-medium ${colours.strong}`}>
              {entry.href ? (
                <TextLink href={entry.href}>{entry.label}</TextLink>
              ) : (
                entry.label
              )}
            </p>
            <p className={colours.muted}>{entry.detail}</p>
          </li>
        ))}
      </ul>
      <p>
        <span className={`font-medium ${colours.strong}`}>
          {now.next.title}
          {": "}
        </span>
        <span className={colours.muted}>{now.next.text}</span>
      </p>
    </div>
  );
}
