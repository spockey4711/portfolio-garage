import Link from "next/link";
import { getProjects } from "@/content/projects";
import { defaultLocale } from "@/lib/i18n";
import { ProjectFacts } from "./ProjectFacts";

// The project list on the start page: one row per project, the whole row a
// link to its page. Rows are divided by rules, not boxed, like the sections.
export function ProjectList() {
  const projects = getProjects(defaultLocale);

  return (
    <ul>
      {projects.map((project) => (
        <li
          key={project.slug}
          className="border-t border-zinc-200 first:border-t-0 dark:border-zinc-800"
        >
          <Link
            href={`/projekte/${project.slug}`}
            className="group focus-visible:outline-accent -mx-3 flex flex-col gap-1 rounded-md px-3 py-5 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-zinc-900"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className="group-hover:text-accent text-lg font-medium tracking-tight">
                {project.name}
              </span>
              <ProjectFacts project={project} />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              {project.tagline}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
