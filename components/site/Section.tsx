import type { ReactNode } from "react";

// One labelled block of a 2D page: the label in the left column like on a
// spec sheet, the content to its right; on a phone the label sits above.
// The id doubles as the anchor a nav link can point at. data-section makes
// it a stop for j and k (components/site/Shortcuts.tsx), which then focus
// the heading, hence its tabIndex.
export function Section({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const headingId = `${id}-titel`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      data-section=""
      className="grid gap-x-8 gap-y-3 border-t border-zinc-200 py-10 sm:grid-cols-[9rem_1fr] dark:border-zinc-800"
    >
      <h2
        id={headingId}
        tabIndex={-1}
        className="focus-visible:outline-accent w-fit self-start rounded-sm font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {title}
      </h2>
      <div className="min-w-0 space-y-4 leading-7">{children}</div>
    </section>
  );
}
