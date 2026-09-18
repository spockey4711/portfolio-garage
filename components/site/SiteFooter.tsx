import { getSiteContent } from "@/content/site";
import { defaultLocale } from "@/lib/i18n";

// The contact row at the foot of every page: mail first, then the profiles.
// Plain anchors, two of them leave the site.
export function SiteFooter() {
  const site = getSiteContent(defaultLocale);

  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <nav
        aria-label={site.footer.label}
        className="mx-auto flex w-full max-w-3xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-6 py-8 text-sm text-zinc-600 dark:text-zinc-400"
      >
        <span className="text-foreground font-medium">{site.name}</span>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {site.footer.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="focus-visible:outline-accent rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
