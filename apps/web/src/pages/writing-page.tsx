import { sortWritingPosts } from "@web24/content";

import { Breadcrumbs } from "../components/breadcrumbs";
import { WritingCard } from "../components/writing-card";

export function WritingPage() {
  const posts = sortWritingPosts();

  return (
    <section className="flex flex-col gap-4 px-[calc(min(16px,8vw))] py-4">
      <Breadcrumbs />
      <div
        className="grid cursor-pointer grid-cols-1 gap-4 sm:grid-cols-2"
        aria-label="Writing posts"
      >
        {posts.map(post => (
          <WritingCard key={post.id} item={post} />
        ))}
      </div>
    </section>
  );
}
