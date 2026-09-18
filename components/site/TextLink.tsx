import Link from "next/link";
import type { ReactNode } from "react";

const className =
  "rounded-sm font-medium underline decoration-zinc-300 underline-offset-4 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent dark:decoration-zinc-700";

// A link in running text. Internal paths go through next/link, everything
// else (mailto, another site) is a plain anchor.
export function TextLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
