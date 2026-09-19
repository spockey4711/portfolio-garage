import { describe, expect, it } from "vitest";
import { getProjects } from "@/content/projects";
import { TOOL_TAG_M, TOOLWALL_PX_PER_M, toolStyle, toolWall } from "./tools";

// The layout is shared with blender/build/build_furniture.py, which builds
// the tools and cannot check what the web hangs over them. So the geometry
// is checked here: every tool and its tag stay on the plate, no tool hangs
// into another, and the DOM puts each hover box where the tool is.

/** The box a tool takes on the wall including the tag above its hook. */
function extent(tool: { y: number; height: number }) {
  return {
    top: tool.y + tool.height / 2 + TOOL_TAG_M.gap + TOOL_TAG_M.height,
    bottom: tool.y - tool.height / 2,
  };
}

describe("tool wall layout", () => {
  it("keeps every tool and its tag on the plate", () => {
    for (const tool of toolWall.tools) {
      expect(Math.abs(tool.x) + tool.width / 2, tool.id).toBeLessThan(
        toolWall.width / 2,
      );
      expect(extent(tool).top, tool.id).toBeLessThan(toolWall.height / 2);
      expect(extent(tool).bottom, tool.id).toBeGreaterThan(
        -toolWall.height / 2,
      );
    }
  });

  it("lets no tool hang into another or into its tag", () => {
    for (const a of toolWall.tools) {
      for (const b of toolWall.tools) {
        if (a.id >= b.id) continue;
        const apart =
          Math.abs(a.x - b.x) >= (a.width + b.width) / 2 ||
          extent(a).bottom >= extent(b).top ||
          extent(b).bottom >= extent(a).top;
        expect(apart, `${a.id} and ${b.id}`).toBe(true);
      }
    }
  });

  // docs/adr/0008: no logo wall. A tool hangs there because a project uses
  // it, spelled exactly as that project's stack spells it, and once.
  it("hangs only tools a project actually uses, each once", () => {
    const used = new Set(getProjects("de").flatMap((project) => project.stack));
    const names = toolWall.tools.map((tool) => tool.tool);
    for (const name of names) expect(used.has(name), name).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("toolStyle", () => {
  it("puts the centre of the plate at the centre of the DOM, in millimetres", () => {
    const style = toolStyle({
      id: "hammer",
      shape: "hammer",
      tool: "PostgreSQL",
      x: 0,
      y: 0,
      width: 0.1,
      height: 0.2,
    });
    expect(style.width).toBe(100);
    expect(style.height).toBe(200);
    expect(style.left).toBe((toolWall.width / 2) * TOOLWALL_PX_PER_M - 50);
    expect(style.top).toBe((toolWall.height / 2) * TOOLWALL_PX_PER_M - 100);
  });

  it("moves right with x and up with y, like the board", () => {
    const base = { id: "hammer", shape: "hammer", tool: "PostgreSQL" } as const;
    const box = { width: 0.1, height: 0.1 };
    const origin = toolStyle({ ...base, ...box, x: 0, y: 0 });
    const moved = toolStyle({ ...base, ...box, x: 0.2, y: 0.1 });
    expect(moved.left - origin.left).toBe(200);
    expect(moved.top - origin.top).toBe(-100);
  });
});
