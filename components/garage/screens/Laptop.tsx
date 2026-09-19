import Link from "next/link";
import { getGarageContent } from "@/content/garage";
import { getProjects } from "@/content/projects";
import { ProjectFacts } from "@/components/site/ProjectFacts";
import { ProjectList } from "@/components/site/ProjectList";
import { defaultLocale } from "@/lib/i18n";

// The laptop of docs/KONZEPT.md §3, since docs/adr/0008 the project list: a
// desktop with one window, one row per project in the order of
// content/projects/index.ts, the featured project on top. Every row is a
// link to its page, the same list as on the start page (ProjectList.tsx),
// laid out for 720 CSS pixels on the display face. Closed, it is scenery:
// Screen.tsx makes it inert, so the links only count once the camera is
// there.
export function Laptop() {
  const content = getGarageContent(defaultLocale).screens.laptop;
  const projects = getProjects(defaultLocale);

  return (
    <div className="flex h-full w-full flex-col bg-zinc-800 p-5 font-sans text-zinc-100 select-none">
      <section
        aria-labelledby="laptop-title"
        className="flex flex-1 flex-col overflow-hidden rounded-lg bg-zinc-900 shadow-2xl"
      >
        <header className="flex items-center gap-2 border-b border-zinc-700 px-4 py-3">
          <span aria-hidden="true" className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
          </span>
          <h2 id="laptop-title" className="ml-2 text-[17px] font-medium">
            {content.title}
          </h2>
        </header>
        <div className="flex flex-1 flex-col px-5 pt-3 pb-5">
          <p className="pb-1 text-[14px] text-zinc-400">{content.intro}</p>
          <ul>
            {projects.map((project, index) => (
              <li
                key={project.slug}
                className="border-t border-zinc-800 first:border-t-0"
              >
                <Link
                  href={`/projekte/${project.slug}`}
                  className="group focus-visible:outline-accent -mx-3 flex flex-col gap-1 rounded-md px-3 py-3 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span className="flex items-baseline gap-3">
                      <span className="group-hover:text-accent text-[20px] font-medium tracking-tight">
                        {project.name}
                      </span>
                      {index === 0 && (
                        <span className="bg-accent/15 text-accent rounded px-2 py-0.5 text-[12px] font-medium">
                          {content.featured}
                        </span>
                      )}
                    </span>
                    <ProjectFacts project={project} size="laptop" />
                  </span>
                  <span className="text-[15px] leading-snug text-zinc-400">
                    {project.tagline}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

// The still's card (StillView.tsx): the same list at page size, without the
// desktop around it, which at a phone's width would shrink the type to a
// few pixels.
export function LaptopCard() {
  const content = getGarageContent(defaultLocale).screens.laptop;

  return (
    <section aria-label={content.title} className="px-5 pb-3">
      <ProjectList tone="dark" />
    </section>
  );
}
