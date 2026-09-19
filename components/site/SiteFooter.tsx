import Link from "next/link";
import { getSiteContent } from "@/content/site";
import { defaultLocale } from "@/lib/i18n";

const linkClassName =
  "focus-visible:outline-accent rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4";

// The foot of every page: the contact row (mail first, then the profiles,
// plain anchors, two of them leave the site) and under it the legal pages.
export function SiteFooter() {
  const site = getSiteContent(defaultLocale);

  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto w-full max-w-3xl space-y-3 px-6 py-8 text-sm text-zinc-600 dark:text-zinc-400">
        <nav
          aria-label={site.footer.label}
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2"
        >
          <span className="text-foreground font-medium">{site.name}</span>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {site.footer.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClassName}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="flex flex-wrap justify-end gap-x-5 gap-y-2 text-xs text-zinc-500">
          {site.footer.legal.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClassName}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
