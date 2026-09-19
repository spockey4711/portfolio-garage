import { GarageHero } from "@/components/garage/GarageHero";
import { PostList } from "@/components/site/PostList";
import { ProjectList } from "@/components/site/ProjectList";
import { Section } from "@/components/site/Section";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TextLink } from "@/components/site/TextLink";
import { getSiteContent } from "@/content/site";
import { defaultLocale } from "@/lib/i18n";

// Start page: the garage as hero, the 2D content below it. The 2D page is the
// source of truth, the garage only links into it (docs/KONZEPT.md §5).
export default function Home() {
  const site = getSiteContent(defaultLocale);

  return (
    <>
      <GarageHero />
      <SiteHeader nameless />
      <main className="mx-auto w-full max-w-3xl px-6 pb-24">
        <div className="py-16">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {site.name}
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {site.home.positioning}
          </p>
          <p className="mt-6 max-w-2xl leading-7">{site.home.intro}</p>
        </div>
        <Section id="projekte" title={site.home.projects.title}>
          <p className="text-zinc-600 dark:text-zinc-400">
            {site.home.projects.intro}
          </p>
          <ProjectList />
        </Section>
        <Section id="blog" title={site.home.blog.title}>
          <p className="text-zinc-600 dark:text-zinc-400">
            {site.home.blog.intro}
          </p>
          <PostList />
        </Section>
        <Section id="ueber" title={site.home.about.title}>
          <p>{site.home.about.teaser}</p>
          <p>
            <TextLink href={site.home.about.more.href}>
              {site.home.about.more.label}
            </TextLink>
          </p>
        </Section>
      </main>
    </>
  );
}
