import layout from "./tools.json";

// What hangs where on the tool wall, the shadow board of docs/KONZEPT.md §3.
// Written once, here, read twice, like the pinboard's layout:
// blender/build/build_furniture.py builds every tool with its hook and its
// painted silhouette from it, so the still and the far view show the board
// full, and ToolWall.tsx lays its DOM (the label under the hook, the
// projects on hover) over exactly those tools once the camera is close.
// Board space: metres from the centre of the plate, x to the right, y up;
// a tool hangs upright, head up, inside its box. Every tool is a tool of the
// stack (docs/adr/0008): `tool` is an entry of a project's `stack` in
// content/projects, and tools.test.ts refuses one that no project uses.

/** The shapes build_furniture.py can build; a new one needs a builder there first. */
export const TOOL_SHAPES = [
  "drehmomentschluessel",
  "maulschluessel",
  "ringschluessel",
  "hammer",
  "schraubendreher",
  "zange",
  "saege",
  "inbus",
  "kettenpeitsche",
  "kassettenabzieher",
  "reifenheber",
  "kettennieter",
] as const;

export type ToolShape = (typeof TOOL_SHAPES)[number];

export type ToolId = keyof typeof layout.tools;

export interface WallTool {
  readonly id: ToolId;
  readonly shape: ToolShape;
  /** The stack entry this tool stands for, spelled as content/projects spells it. */
  readonly tool: string;
  readonly x: number;
  readonly y: number;
  /** The box the tool hangs in; the DOM's hover area is exactly this box. */
  readonly width: number;
  readonly height: number;
}

export interface ToolWallLayout {
  /** Size of the plate inside the rails: the face the DOM covers. */
  readonly width: number;
  readonly height: number;
  readonly tools: ReadonlyArray<WallTool>;
}

function isShape(shape: string): shape is ToolShape {
  return (TOOL_SHAPES as readonly string[]).includes(shape);
}

function toTool(id: ToolId): WallTool {
  const { shape, ...rest } = layout.tools[id];
  if (!isShape(shape)) {
    throw new Error(`tools.json: ${id} has unknown shape ${shape}`);
  }
  return { id, shape, ...rest };
}

export const toolWall: ToolWallLayout = {
  width: layout.board.width,
  height: layout.board.height,
  tools: (Object.keys(layout.tools) as ToolId[]).map(toTool),
};

/**
 * CSS pixels per metre of board in the DOM: one per millimetre, like the
 * pinboard, so a 26 px label is 26 mm of paint on the wall. Screen.tsx
 * scales the whole DOM onto the plate in the room.
 */
export const TOOLWALL_PX_PER_M = 1000;

/**
 * The tag above a tool's hook in metres: how far above the box it starts
 * and how tall it is with the name alone. The projects on hover extend it
 * downwards, over the hook. tools.test.ts keeps the tag on the plate and
 * out of the tool above.
 */
export const TOOL_TAG_M = { gap: 0.005, height: 0.03 } as const;

/** Where a tool's box sits in the wall's DOM, for absolute positioning in CSS pixels. */
export function toolStyle(tool: WallTool): {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
} {
  const px = TOOLWALL_PX_PER_M;
  const width = tool.width * px;
  const height = tool.height * px;
  return {
    left: (toolWall.width / 2 + tool.x) * px - width / 2,
    top: (toolWall.height / 2 - tool.y) * px - height / 2,
    width,
    height,
  };
}
