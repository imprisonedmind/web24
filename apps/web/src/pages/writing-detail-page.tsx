import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "@tanstack/react-router";

import { getWritingPostBySlugParts } from "@web24/content";

import { Breadcrumbs } from "../components/breadcrumbs";
import { NotionPage } from "../components/notion-page";
import { ReviewScore } from "../components/review-score";
import { writingRecordMapQueryOptions } from "../lib/api";

export function WritingDetailPage() {
  const params = useParams({ from: "/writing/$slug/$id" });
  const post = getWritingPostBySlugParts(params.slug, params.id);
  const { data: recordMap } = useQuery(writingRecordMapQueryOptions(params.id));

  if (!post) {
    return <Navigate to="/writing" />;
  }

  return (
    <section className="flex flex-col gap-6 px-[calc(min(16px,8vw))]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <Breadcrumbs />
        {(post.score !== undefined || post.date) ? (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3 text-sm text-neutral-600 sm:text-base">
            {post.score !== undefined ? <ReviewScore score={post.score} /> : null}
            {post.date ? <p className="whitespace-nowrap">{post.date}</p> : null}
          </div>
        ) : null}
      </div>

      {recordMap ? <NotionPage recordMap={recordMap} /> : null}
    </section>
  );
}
