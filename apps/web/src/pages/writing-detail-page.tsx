import { Navigate, useParams } from "@tanstack/react-router";

import { getWritingPostBySlugParts } from "@web24/content";

import { ReviewScoreBadge, SmallLink } from "../components/legacy";

export function WritingDetailPage() {
  const params = useParams({ from: "/writing/$slug/$id" });
  const post = getWritingPostBySlugParts(params.slug, params.id);

  if (!post) {
    return <Navigate to="/writing" />;
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <SmallLink href="/writing" label="back to writing" />
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{post.title}</h1>
          <p className="m-0 max-w-3xl text-neutral-600">{post.description}</p>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 text-sm text-neutral-600 sm:text-base">
          {post.score !== undefined ? <ReviewScoreBadge score={post.score} /> : null}
          <p className="m-0 whitespace-nowrap">{post.date}</p>
        </div>
      </div>

      <article className="overflow-hidden rounded-[1.4rem] bg-white shadow-sm">
        <img
          className="block max-h-[24rem] w-full object-cover"
          src={`/${post.openGraph}`}
          alt={post.title}
        />
        <div className="flex justify-between gap-4 px-4 pb-0 pt-4 text-sm text-neutral-500">
          <span>{post.date}</span>
          {post.score !== undefined ? <span>score {post.score.toFixed(1)}</span> : null}
        </div>
        <p className="m-0 p-4 leading-7 text-neutral-600">
          This page is now part of the prerendered route manifest for the Vite SPA. The next
          migration step is replacing this extracted summary view with the full Notion-backed
          content rendering path.
        </p>
      </article>
    </section>
  );
}
