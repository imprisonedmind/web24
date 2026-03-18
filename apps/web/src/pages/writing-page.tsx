import { sortWritingPosts } from "@web24/content";

import { WritingCard } from "../components/catalog";

export function WritingPage() {
  const posts = sortWritingPosts();

  return (
    <section
      className="grid grid-cols-1 gap-4 px-[calc(min(16px,8vw))] py-4 sm:grid-cols-2"
      aria-label="Writing posts"
    >
      {posts.map((post) => (
        <WritingCard key={post.id} post={post} />
      ))}
    </section>
  );
}
