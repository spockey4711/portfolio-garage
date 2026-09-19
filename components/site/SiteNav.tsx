"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@/content/site";

// Client only for aria-current: the layout that renders the header does not
// know which page it wraps. A hash link ("/#projekte") is never current, the
// section it points at is not a page.
export function SiteNav({
  label,
  links,
}: {
  readonly label: string;
  readonly links: readonly NavLink[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      <ul className="flex gap-5 text-sm">
        {links.map((link) => {
          const current = link.href === pathname;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`focus-visible:outline-accent rounded-sm whitespace-nowrap underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 ${
                  current
                    ? "text-foreground"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
