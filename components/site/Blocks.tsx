import type { ContentBlock } from "@/content/blocks";

// Running text from structured content (content/blocks.ts): each block kind
// has one rendering, so a post and the colophon read the same.
export function Blocks({
  blocks,
}: {
  readonly blocks: readonly ContentBlock[];
}) {
  return blocks.map((block, index) => <Block key={index} block={block} />);
}

function Block({ block }: { readonly block: ContentBlock }) {
  switch (block.kind) {
    case "p":
      return <p>{block.text}</p>;
    case "h2":
      return (
        <h2 className="pt-4 text-xl font-semibold tracking-tight">
          {block.text}
        </h2>
      );
    case "ul":
      return (
        <ul className="list-disc space-y-2 pl-5 marker:text-zinc-400">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="border-accent border-l-2 pl-5 text-zinc-600 italic dark:text-zinc-400">
          {block.text}
        </blockquote>
      );
  }
}
