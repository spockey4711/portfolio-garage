import { TextLink } from "@/components/site/TextLink";
import {
  getLegalContent,
  type LegalPage as LegalPageContent,
} from "@/content/legal";
import { defaultLocale } from "@/lib/i18n";

// /impressum and /datenschutz share one layout: title, optional intro, the
// sections as plain running text with their own h2, the date at the foot.
// No Section grid here, legal text reads top to bottom.
export function LegalPage({ page }: { readonly page: LegalPageContent }) {
  const legal = getLegalContent(defaultLocale);

  return (
    <article>
      <div className="py-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {page.title}
        </h1>
        {page.intro && (
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {page.intro}
          </p>
        )}
      </div>
      <div className="max-w-2xl space-y-10 border-t border-zinc-200 pt-10 leading-7 dark:border-zinc-800">
        {page.sections.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
              {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.address && (
              <address className="not-italic">
                {section.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            )}
            {section.links && (
              <p>
                {section.links.map((link) => (
                  <TextLink key={link.href} href={link.href}>
                    {link.label}
                  </TextLink>
                ))}
              </p>
            )}
            {section.items && (
              <ul className="list-disc space-y-2 pl-5 marker:text-zinc-400">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="font-mono text-xs text-zinc-500">
          {legal.updatedLabel} {page.updated}
        </p>
      </div>
    </article>
  );
}
