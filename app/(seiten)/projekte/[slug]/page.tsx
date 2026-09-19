import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FuelPlanCard } from "@/components/site/FuelPlanCard";
import { ProjectFacts } from "@/components/site/ProjectFacts";
import { Section } from "@/components/site/Section";
import { TextLink } from "@/components/site/TextLink";
import { getProject, getProjectLabels, getProjects } from "@/content/projects";
import { getSiteContent } from "@/content/site";
import { defaultLocale } from "@/lib/i18n";

type Params = Readonly<{ slug: string }>;

// Every project page is built at build time; a slug outside the list is a 404,
// not a fallback render.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getProjects(defaultLocale).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug, defaultLocale);
  if (!project) return {};
  return { title: project.name, description: project.tagline };
}

export default async function Projekt({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug, defaultLocale);
  if (!project) notFound();
  const site = getSiteContent(defaultLocale);
  const labels = getProjectLabels(defaultLocale);

  return (
    <article>
      <div className="py-16">
        <p className="text-sm">
          <TextLink href={site.project.back.href}>
            {site.project.back.label}
          </TextLink>
        </p>
        <div className="mt-8">
          <ProjectFacts project={project} />
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {project.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {project.tagline}
        </p>
        {project.links.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {project.links.map((link) => (
              <li key={link.href}>
                <TextLink href={link.href}>{labels.link[link.kind]}</TextLink>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Section id="problem" title={site.project.sections.problem}>
        <p>{project.problem}</p>
      </Section>
      <Section id="ansatz" title={site.project.sections.approach}>
        <p>{project.approach.intro}</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-zinc-400">
          {project.approach.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </Section>
      {project.demo === "fuelplan" && (
        <Section id="live" title={site.project.plan.title}>
          <p>{site.project.plan.intro}</p>
          <FuelPlanCard />
          <p>
            <TextLink href={site.project.plan.more.href}>
              {site.project.plan.more.label}
            </TextLink>
          </p>
        </Section>
      )}
      <Section id="ergebnis" title={site.project.sections.result}>
        <p>{project.result}</p>
      </Section>
      <Section id="stack" title={site.project.sections.stack}>
        <ul className="flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <li
              key={item}
              className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-xs dark:border-zinc-800"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>
      <Section id="gelernt" title={site.project.sections.learnings}>
        <ul className="list-disc space-y-2 pl-5 marker:text-zinc-400">
          {project.learnings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
