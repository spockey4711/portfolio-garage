import { getProjectLabels, type Project } from "@/content/projects";
import { defaultLocale } from "@/lib/i18n";

// The three facts every project states: what shape it is, when, where it
// stands. One mono line, no separator glyphs, the gap is the separator.
export function ProjectFacts({ project }: { readonly project: Project }) {
  const labels = getProjectLabels(defaultLocale);

  return (
    <ul className="flex flex-wrap gap-x-4 font-mono text-xs text-zinc-500">
      <li>{labels.kind[project.kind]}</li>
      <li>{project.year}</li>
      <li>{labels.status[project.status]}</li>
    </ul>
  );
}
