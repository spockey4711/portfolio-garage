import Link from "next/link";
import { getPostLabels, getPosts } from "@/content/blog";
import { defaultLocale } from "@/lib/i18n";

interface PostListProps {
  /**
   * "page" follows the colour scheme like the rest of the page; "dark" is
   * for the still's card (components/garage/StillView.tsx), which is dark in
   * both schemes.
   */
  readonly tone?: "page" | "dark";
}

const tones: Readonly<
  Record<
    NonNullable<PostListProps["tone"]>,
    { rule: string; hover: string; summary: string }
  >
> = {
  page: {
    rule: "border-zinc-200 dark:border-zinc-800",
    hover: "hover:bg-zinc-50 dark:hover:bg-zinc-900",
    summary: "text-zinc-600 dark:text-zinc-400",
  },
  dark: {
    rule: "border-zinc-800",
    hover: "hover:bg-zinc-800",
    summary: "text-zinc-400",
  },
};

// The blog on the start page: one row per post, newest first, the whole row
// a link to the post. Same rules and hover as ProjectList.tsx, so the two
// sections read alike; the date sits under the title, where the post page
// puts it too, instead of on the right where a long title would push it down.
export function PostList({ tone = "page" }: PostListProps) {
  const posts = getPosts(defaultLocale);
  const labels = getPostLabels(defaultLocale);
  const colours = tones[tone];

  return (
    <ul>
      {posts.map((post) => (
        <li
          key={post.slug}
          className={`border-t first:border-t-0 ${colours.rule}`}
        >
          <Link
            href={`/blog/${post.slug}`}
            className={`group focus-visible:outline-accent -mx-3 flex flex-col gap-1 rounded-md px-3 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 ${colours.hover}`}
          >
            <span className="group-hover:text-accent text-lg font-medium tracking-tight">
              {post.title}
            </span>
            <time
              dateTime={post.date}
              className="font-mono text-xs text-zinc-500"
            >
              {labels.date(post.date)}
            </time>
            <p className={colours.summary}>{post.summary}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
