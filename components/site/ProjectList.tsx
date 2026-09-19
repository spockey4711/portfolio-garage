import Link from "next/link";
import { getProjects } from "@/content/projects";
import { defaultLocale } from "@/lib/i18n";
import { ProjectFacts } from "./ProjectFacts";

interface ProjectListProps {
  /**
   * "page" follows the colour scheme like the rest of the page; "dark" is
   * for the still's card (components/garage/StillView.tsx), which is dark in
   * both schemes.
   */
  readonly tone?: "page" | "dark";
}

const tones: Readonly<
  Record<
    NonNullable<ProjectListProps["tone"]>,
    { rule: string; hover: string; tagline: string }
  >
> = {
  page: {
    rule: "border-zinc-200 dark:border-zinc-800",
    hover: "hover:bg-zinc-50 dark:hover:bg-zinc-900",
    tagline: "text-zinc-600 dark:text-zinc-400",
  },
  dark: {
    rule: "border-zinc-800",
    hover: "hover:bg-zinc-800",
    tagline: "text-zinc-400",
  },
};

// The project list on the start page: one row per project, the whole row a
// link to its page. Rows are divided by rules, not boxed, like the sections.
export function ProjectList({ tone = "page" }: ProjectListProps) {
  const projects = getProjects(defaultLocale);
  const colours = tones[tone];

  return (
    <ul>
      {projects.map((project) => (
        <li
          key={project.slug}
          className={`border-t first:border-t-0 ${colours.rule}`}
        >
          <Link
            href={`/projekte/${project.slug}`}
            className={`group focus-visible:outline-accent -mx-3 flex flex-col gap-1 rounded-md px-3 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 ${colours.hover}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className="group-hover:text-accent text-lg font-medium tracking-tight">
                {project.name}
              </span>
              <ProjectFacts project={project} />
            </div>
            <p className={colours.tagline}>{project.tagline}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
