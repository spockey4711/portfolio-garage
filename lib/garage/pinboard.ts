import layout from "./pinboard.json";

// What hangs where on the cork board. The layout is written once, here, and
// read twice: blender/build/build_furniture.py builds the cork face and a
// paper stand-in with a pin for every item, so the still and the far view
// show the board filled, and Pinboard.tsx lays the real items (DOM, links)
// over exactly those stand-ins once the camera is close. Board space: metres
// from the centre of the cork, x to the right, y up; rotation clockwise in
// degrees as seen from the room, which is CSS rotate() and Blender's
// rotation about +Y alike.

export const PINBOARD_ITEM_KINDS = ["startnummer", "foto", "zettel"] as const;

export type PinboardItemKind = (typeof PINBOARD_ITEM_KINDS)[number];

export type PinboardItemId = keyof typeof layout.items;

export interface PinboardItem {
  readonly id: PinboardItemId;
  readonly kind: PinboardItemKind;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
}

export interface PinboardLayout {
  /** Size of the cork face inside the frame: the face the DOM covers. */
  readonly width: number;
  readonly height: number;
  /** Distance of every pin from its item's top edge. */
  readonly pinInset: number;
  readonly items: ReadonlyArray<PinboardItem>;
}

function isKind(kind: string): kind is PinboardItemKind {
  return (PINBOARD_ITEM_KINDS as readonly string[]).includes(kind);
}

function toItem(id: PinboardItemId): PinboardItem {
  const { kind, ...rest } = layout.items[id];
  if (!isKind(kind)) {
    throw new Error(`pinboard.json: ${id} has unknown kind ${kind}`);
  }
  return { id, kind, ...rest };
}

export const pinboard: PinboardLayout = {
  width: layout.cork.width,
  height: layout.cork.height,
  pinInset: layout.cork.pinInset,
  items: (Object.keys(layout.items) as PinboardItemId[]).map(toItem),
};

/**
 * CSS pixels per metre of board in the DOM: one per millimetre, so the
 * layout reads in metres and the type on a 19 cm race number is set for
 * 190 px. Screen.tsx scales the whole DOM onto the face in the room.
 */
export const PINBOARD_PX_PER_M = 1000;

/** Where an item sits in the board's DOM, for absolute positioning in CSS pixels. */
export function itemStyle(item: PinboardItem): {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly transform: string;
} {
  const px = PINBOARD_PX_PER_M;
  const width = item.width * px;
  const height = item.height * px;
  return {
    left: (pinboard.width / 2 + item.x) * px - width / 2,
    top: (pinboard.height / 2 - item.y) * px - height / 2,
    width,
    height,
    transform: `rotate(${item.rotation}deg)`,
  };
}
