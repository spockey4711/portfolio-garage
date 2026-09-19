import type { Metadata } from "next";
import { NowList } from "@/components/site/NowList";
import { Section } from "@/components/site/Section";
import { TextLink } from "@/components/site/TextLink";
import { getAboutContent } from "@/content/about";
import { defaultLocale } from "@/lib/i18n";

const about = getAboutContent(defaultLocale);

export const metadata: Metadata = {
  title: about.title,
  description: about.description,
};

export default function Ueber() {
  return (
    <>
      <div className="py-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {about.title}
        </h1>
        <div className="mt-6 max-w-2xl space-y-4 leading-7">
          {about.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <Section id="gerade" title={about.now.title}>
        <NowList />
      </Section>
      <Section id="werdegang" title={about.career.title}>
        <ul className="space-y-6">
          {about.career.entries.map((entry) => (
            <li key={`${entry.role} ${entry.org}`}>
              <p className="font-mono text-xs text-zinc-500">{entry.period}</p>
              <p className="mt-1 font-medium">
                {entry.role}
                <span className="text-zinc-600 dark:text-zinc-400">
                  {", "}
                  {entry.org}
                </span>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {entry.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>
      <Section id="stack" title={about.skills.title}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[8rem_1fr]">
          {about.skills.groups.map((group) => (
            <div key={group.title} className="contents">
              <dt className="font-medium">{group.title}</dt>
              <dd className="text-zinc-600 dark:text-zinc-400">
                {group.items.join(", ")}
              </dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="arbeitsweise" title={about.principles.title}>
        <ul className="list-disc space-y-1 pl-5 marker:text-zinc-400">
          {about.principles.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
      <Section id="kontakt" title={about.contact.title}>
        <p>{about.contact.lead}</p>
        <p>
          <TextLink href={`mailto:${about.contact.email}`}>
            {about.contact.email}
          </TextLink>
        </p>
      </Section>
    </>
  );
}
