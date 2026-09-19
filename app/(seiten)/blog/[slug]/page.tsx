import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextLink } from "@/components/site/TextLink";
import {
  getPost,
  getPostLabels,
  getPosts,
  type PostBlock,
} from "@/content/blog";
import { getSiteContent } from "@/content/site";
import { defaultLocale } from "@/lib/i18n";

type Params = Readonly<{ slug: string }>;

// Every post is built at build time; a slug outside content/blog/index.ts is
// a 404, not a fallback render.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getPosts(defaultLocale).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug, defaultLocale);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function Beitrag({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug, defaultLocale);
  if (!post) notFound();
  const site = getSiteContent(defaultLocale);
  const labels = getPostLabels(defaultLocale);

  return (
    <article>
      <div className="py-16">
        <p className="text-sm">
          <TextLink href={site.post.back.href}>{site.post.back.label}</TextLink>
        </p>
        <time
          dateTime={post.date}
          className="mt-8 block font-mono text-xs text-zinc-500"
        >
          {labels.date(post.date)}
        </time>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {post.summary}
        </p>
      </div>
      <div className="max-w-2xl space-y-5 border-t border-zinc-200 pt-10 leading-7 dark:border-zinc-800">
        {post.body.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    </article>
  );
}

// The body is structured content (content/blog/types.ts); each block kind
// has one rendering, so every post reads the same.
function Block({ block }: { readonly block: PostBlock }) {
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
