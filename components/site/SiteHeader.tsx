import Link from "next/link";
import { getSiteContent } from "@/content/site";
import { defaultLocale } from "@/lib/i18n";
import { buildCommands } from "@/lib/palette";
import { CommandPalette } from "./CommandPalette";
import { SiteNav } from "./SiteNav";

// The row that opens every 2D page: name left, the site links and the
// command palette right. On the start page it sits below the garage, so the
// hero stays the hero, and drops the name, because the h1 right under it is
// the name. The palette's list is built here, on the server, so the client
// gets data and not the content modules.
export function SiteHeader({ nameless = false }: { nameless?: boolean }) {
  const site = getSiteContent(defaultLocale);
  const commands = buildCommands(defaultLocale);

  return (
    <header
      className={`mx-auto flex w-full max-w-3xl items-baseline gap-6 px-6 py-5 ${
        nameless ? "justify-end" : "justify-between"
      }`}
    >
      {!nameless && (
        <Link
          href="/"
          className="focus-visible:outline-accent rounded-sm font-medium tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {site.name}
        </Link>
      )}
      <div className="flex items-baseline gap-5">
        <SiteNav label={site.nav.label} links={site.nav.links} />
        <CommandPalette content={site.palette} commands={commands} />
      </div>
    </header>
  );
}
