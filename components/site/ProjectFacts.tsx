import { getProjectLabels, type Project } from "@/content/projects";
import { defaultLocale } from "@/lib/i18n";

interface ProjectFactsProps {
  readonly project: Project;
  /**
   * Type size of the line. The page reads it at text-xs; the laptop screen
   * (components/garage/screens/Laptop.tsx) is laid out in CSS pixels for its
   * display and sets its own.
   */
  readonly size?: "page" | "laptop";
}

const sizes: Readonly<Record<NonNullable<ProjectFactsProps["size"]>, string>> =
  {
    page: "text-xs",
    laptop: "text-[13px]",
  };

// The three facts every project states: what shape it is, when, where it
// stands. One mono line, no separator glyphs, the gap is the separator.
export function ProjectFacts({ project, size = "page" }: ProjectFactsProps) {
  const labels = getProjectLabels(defaultLocale);

  return (
    <ul
      className={`flex flex-wrap gap-x-4 font-mono text-zinc-500 ${sizes[size]}`}
    >
      <li>{labels.kind[project.kind]}</li>
      <li>{project.year}</li>
      <li>{labels.status[project.status]}</li>
    </ul>
  );
}
