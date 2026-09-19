import type { Metadata } from "next";
import { Blocks } from "@/components/site/Blocks";
import { Section } from "@/components/site/Section";
import { TextLink } from "@/components/site/TextLink";
import { getColophonContent } from "@/content/bauweise";
import { defaultLocale } from "@/lib/i18n";

const colophon = getColophonContent(defaultLocale);

export const metadata: Metadata = {
  title: colophon.title,
  description: colophon.description,
};

// The colophon (docs/KONZEPT.md §10): the same layout as /ueber, one
// Section per decision, the repository at the foot.
export default function Bauweise() {
  return (
    <>
      <div className="py-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {colophon.title}
        </h1>
        <div className="mt-6 max-w-2xl space-y-4 leading-7">
          {colophon.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      {colophon.sections.map((section) => (
        <Section key={section.id} id={section.id} title={section.title}>
          <Blocks blocks={section.blocks} />
        </Section>
      ))}
      <p className="border-t border-zinc-200 pt-10 leading-7 dark:border-zinc-800">
        {colophon.source.lead}{" "}
        <TextLink href={colophon.source.link.href}>
          {colophon.source.link.label}
        </TextLink>
      </p>
    </>
  );
}
