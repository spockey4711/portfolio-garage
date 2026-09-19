import Image from "next/image";
import { PostList } from "@/components/site/PostList";
import { getPost, getPostLabels, type Post } from "@/content/blog";
import { getGarageContent, type PinboardItemContent } from "@/content/garage";
import {
  itemStyle,
  PINBOARD_PX_PER_M,
  type PinboardDecoItem,
  type PinboardItem,
  type PinboardNoteItem,
  pinboard,
} from "@/lib/garage/pinboard";
import { defaultLocale } from "@/lib/i18n";

// The cork board of docs/KONZEPT.md §3, since docs/adr/0008 the blog: every
// note is a post and a link to it, race numbers and photos are scenery. The
// board itself is not drawn; the DOM is transparent and lies on the GLB's
// board face, so the baked cork and frame show through, and each item sits
// exactly on the paper stand-in the GLB carries for it
// (lib/garage/pinboard.ts). Plain anchors, like HotspotNav: leaving the
// garage is a page load, and they work without JavaScript.
export function Pinboard() {
  const content = getGarageContent(defaultLocale).screens.pinnwand;
  const notes = pinboard.items.filter(isNote);
  const deco = pinboard.items.filter(isDeco);

  return (
    <nav
      aria-label={content.label}
      className="relative h-full w-full font-sans"
    >
      <p className="sr-only">{content.hint}</p>
      <ul>
        {notes.map((item) => (
          <li key={item.id} className="absolute" style={itemStyle(item)}>
            <a
              href={`/blog/${item.post}`}
              className="block h-full w-full shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-[transform,box-shadow] outline-none hover:scale-[1.04] hover:shadow-[0_4px_10px_rgba(0,0,0,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Note item={item} post={postOf(item)} />
            </a>
            <Pin />
          </li>
        ))}
      </ul>
      {deco.map((item) => (
        <div
          key={item.id}
          aria-hidden="true"
          className="absolute shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
          style={itemStyle(item)}
        >
          <Deco item={item} content={content.items[item.id]} />
          <Pin />
        </div>
      ))}
    </nav>
  );
}

// The still's card (StillView.tsx): the notes scaled to a phone would be
// unreadable, so the card shows the same posts as the start page, page-sized.
export function PinboardCard() {
  return (
    <div className="px-5 pb-5">
      <PostList tone="dark" />
    </div>
  );
}

function isNote(item: PinboardItem): item is PinboardNoteItem {
  return item.kind === "zettel";
}

function isDeco(item: PinboardItem): item is PinboardDecoItem {
  return item.kind !== "zettel";
}

// A missing post is a layout error, and lib/garage/pinboard.test.ts catches
// it before the board renders; this keeps the render free of undefined.
function postOf(item: PinboardNoteItem): Post {
  const post = getPost(item.post, defaultLocale);
  if (!post) {
    throw new Error(
      `pinboard.json: ${item.id} names unknown post ${item.post}`,
    );
  }
  return post;
}

// A post on a note. Sizes are CSS pixels at PINBOARD_PX_PER_M, so a 13 cm
// note is 130 px wide and its type is set for that. An upright note has room
// for the summary, which takes what height is left and fades out at the
// bottom instead of being cut mid-line; a landscape note shows title and date.
function Note({
  item,
  post,
}: {
  readonly item: PinboardNoteItem;
  readonly post: Post;
}) {
  const labels = getPostLabels(defaultLocale);
  const upright = item.height > item.width;

  return (
    <span className="flex h-full w-full flex-col gap-[3px] overflow-hidden bg-[#f6f1df] px-[9px] pt-[22px] pb-[8px] break-words text-zinc-800">
      <span className="line-clamp-3 text-[13px] leading-tight font-semibold">
        {post.title}
      </span>
      <time
        dateTime={post.date}
        className="font-mono text-[9px] tracking-wide text-zinc-500"
      >
        {labels.date(post.date)}
      </time>
      {upright && (
        <span className="min-h-0 flex-1 overflow-hidden mask-b-from-40% mask-b-to-100% text-[10.5px] leading-snug">
          {post.summary}
        </span>
      )}
    </span>
  );
}

// What is printed on a race number or a photo.
function Deco({
  item,
  content,
}: {
  readonly item: PinboardDecoItem;
  readonly content: PinboardItemContent;
}) {
  switch (content.kind) {
    case "startnummer":
      return (
        <span className="flex h-full w-full flex-col items-center justify-between bg-[#f4f1ea] px-3 pt-[24px] pb-2 text-zinc-900">
          <span className="text-[13px] font-medium tracking-[0.12em] uppercase">
            {content.event}
          </span>
          <span className="font-mono text-[64px] leading-none font-bold tabular-nums">
            {content.number}
          </span>
          <span aria-hidden="true" className="bg-accent h-[6px] w-full" />
        </span>
      );
    case "foto":
      return (
        <span className="flex h-full w-full flex-col bg-[#f7f5f0] p-[6px] pb-0">
          {content.src ? (
            <span className="relative min-h-0 flex-1">
              <Image
                src={content.src}
                alt={content.caption}
                fill
                sizes={`${Math.round(item.width * PINBOARD_PX_PER_M)}px`}
                className="object-cover"
              />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className={[
                "min-h-0 flex-1",
                item.width > item.height
                  ? "bg-[linear-gradient(to_bottom,#9db0ba_0%,#d3d9d3_58%,#6b7566_59%,#4a534b_100%)]"
                  : "bg-[linear-gradient(to_bottom,#9db0ba_0%,#d3d9d3_62%,#5d6a57_63%,#414a41_100%)]",
              ].join(" ")}
            />
          )}
          <span className="flex h-[18px] items-center justify-center text-[11px] text-zinc-600">
            {content.caption}
          </span>
        </span>
      );
    case "zettel":
      // content.items carries no print for a note; the layout names its post
      return null;
  }
}

/** The pin holding the item, where the GLB's pin is: top centre, pinInset below the edge. */
function Pin() {
  const size = 10;
  return (
    <span
      aria-hidden="true"
      className="bg-accent pointer-events-none absolute left-1/2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.25)]"
      style={{
        width: size,
        height: size,
        top: pinboard.pinInset * PINBOARD_PX_PER_M - size / 2,
        marginLeft: -size / 2,
      }}
    />
  );
}
