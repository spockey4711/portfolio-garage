import Link from "next/link";
import { TextLink } from "@/components/site/TextLink";
import { getGarageContent } from "@/content/garage";
import { getProjects, type Project } from "@/content/projects";
import {
  TOOL_TAG_M,
  TOOLWALL_PX_PER_M,
  type WallTool,
  toolStyle,
  toolWall,
} from "@/lib/garage/tools";
import { defaultLocale } from "@/lib/i18n";

// The shadow board of docs/KONZEPT.md §3, since docs/adr/0008 the stack:
// every tool on it stands for an entry a project's stack lists, and hovering
// it names the projects. The board and the tools are not drawn; the DOM is
// transparent and lies on the plate between the rails, one hover box over
// each tool the GLB carries (lib/garage/tools.ts). What is drawn is the
// tape label above every hook, as on a real shadow board, and on hover or
// focus the projects under it as links, so the wall works by keyboard too.
// Sizes are CSS pixels at TOOLWALL_PX_PER_M: a 24 px label is 24 mm of
// tape, which the focus camera 1.4 m in front shows at about 16 px.
export function ToolWall() {
  const content = getGarageContent(defaultLocale).screens.werkzeugwand;
  const projects = getProjects(defaultLocale);
  const px = TOOLWALL_PX_PER_M;

  return (
    <section
      aria-label={content.label}
      className="relative h-full w-full font-sans select-none"
    >
      <p className="sr-only">{content.hint}</p>
      <ul>
        {toolWall.tools.map((tool) => (
          <li key={tool.id} className="group absolute" style={toolStyle(tool)}>
            <div
              className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center"
              style={{ top: -(TOOL_TAG_M.gap + TOOL_TAG_M.height) * px }}
            >
              <Tag height={TOOL_TAG_M.height * px}>{tool.tool}</Tag>
              {/* Not display:none: the links must stay in the Tab order to open the tag. */}
              <ul className="flex max-h-0 flex-col items-center gap-[2px] overflow-hidden opacity-0 transition-[max-height,opacity] duration-150 group-focus-within:max-h-[120px] group-focus-within:opacity-100 group-hover:max-h-[120px] group-hover:opacity-100">
                {projectsUsing(tool, projects).map((project) => (
                  <li key={project.slug}>
                    <Link
                      href={`/projekte/${project.slug}`}
                      className="block rounded-[3px] bg-[#f4efe2] px-[10px] py-[3px] text-[22px] leading-none font-medium whitespace-nowrap text-[#2a2622] shadow-[0_1px_2px_rgba(0,0,0,0.45)] outline-none hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The still's card (StillView.tsx): the tags scaled to a phone are
// unreadable, so the card lists the same tools with their projects.
export function ToolWallCard() {
  const content = getGarageContent(defaultLocale).screens.werkzeugwand;
  const projects = getProjects(defaultLocale);

  return (
    <div className="space-y-4 px-5 pb-5">
      <p className="text-zinc-400">{content.hint}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        {toolWall.tools.map((tool) => (
          <div key={tool.id} className="contents">
            <dt className="font-medium text-zinc-100">{tool.tool}</dt>
            <dd className="text-zinc-400">
              {projectsUsing(tool, projects).map((project, index) => (
                <span key={project.slug}>
                  {index > 0 && ", "}
                  <TextLink href={`/projekte/${project.slug}`}>
                    {project.name}
                  </TextLink>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// A strip of tape with the name on it, stencil-like: uppercase, spaced.
function Tag({
  height,
  children,
}: {
  readonly height: number;
  readonly children: string;
}) {
  return (
    <span
      className="flex items-center bg-[#ded6c4] px-[10px] text-[20px] font-semibold tracking-[0.08em] whitespace-nowrap text-[#2a2622] uppercase shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
      style={{ height }}
    >
      {children}
    </span>
  );
}

// The projects whose stack lists this tool, in the order of
// content/projects/index.ts. Never empty: tools.test.ts refuses a tool no
// project uses.
function projectsUsing(
  tool: WallTool,
  projects: readonly Project[],
): Project[] {
  return projects.filter((project) => project.stack.includes(tool.tool));
}
