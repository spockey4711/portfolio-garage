// Running text as structured content, not Markdown: a list of blocks a page
// renders in reading order, so every string sits behind get<Thing>(locale)
// (docs/adr/0003) and content.test.ts can check it. Blog posts and the
// colophon share this shape; components/site/Blocks.tsx is the one rendering.

export type ContentBlock =
  | { readonly kind: "p"; readonly text: string }
  | { readonly kind: "h2"; readonly text: string }
  | { readonly kind: "ul"; readonly items: readonly string[] }
  | { readonly kind: "quote"; readonly text: string };
