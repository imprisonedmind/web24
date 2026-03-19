import { Link } from "@tanstack/react-router";

import type { WorkItem, WritingPost } from "@web24/content";
import { getWritingRoutePath } from "@web24/content";

import { CFImage } from "./cf-image";
import { ReviewScoreBadge, SectionHeader } from "./legacy";

export function WorkSection({
  title,
  items
}: {
  title: string;
  items: WorkItem[];
}) {
  return (
    <section className="grid gap-3">
      <SectionHeader title={title} />
      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label={`${title} work`}
      >
        {items.map(item => (
          <a
            key={item.title}
            className="flex w-full flex-col gap-4 overflow-hidden rounded-xl bg-white p-2 text-inherit no-underline shadow-sm transition duration-300 ease-in-out hover:shadow-md"
            href={item.link}
            target={item.internal ? "_self" : "_blank"}
            rel={item.internal ? undefined : "noreferrer"}
          >
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <CFImage
                className="h-full w-full bg-gray-200 object-cover"
                src={item.image}
                alt={item.alt}
                widths={[320, 640, 960]}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="line-clamp-1 font-medium text-neutral-900">{item.title}</p>
                <p className="line-clamp-2 text-sm text-neutral-500">
                  {item.description ?? item.alt}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {item.year ? (
                  <span className="text-xs tracking-wide text-neutral-400">{item.year}</span>
                ) : null}
                <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs tracking-wide text-neutral-600">
                  {item.tag}
                </span>
              </div>
            </div>
          </a>
        ))}
      </section>
    </section>
  );
}

export function WritingCard({ post }: { post: WritingPost }) {
  return (
    <Link
      className="flex w-full flex-col gap-4 overflow-hidden rounded-xl bg-white p-2 text-inherit no-underline shadow-sm transition duration-300 ease-in-out hover:shadow-md"
      to={getWritingRoutePath(post)}
    >
      <CFImage
        className="max-h-[160px] w-full rounded-lg bg-gray-200 object-cover"
        src={`/${post.openGraph}`}
        alt={post.title}
        widths={[320, 640, 960]}
        sizes="(max-width: 768px) 100vw, 640px"
      />
      <div className="flex flex-col gap-1 px-1 pb-2">
        <div className="flex flex-row items-center justify-between gap-3">
          <p className="line-clamp-1 font-medium">{post.title}</p>
          <p className="flex-shrink-0 text-xs text-neutral-500">{post.date}</p>
        </div>

        <p className="line-clamp-3 text-sm text-neutral-500">{post.description}</p>

        {post.score !== undefined ? (
          <span className="mt-1">
            <ReviewScoreBadge score={post.score} />
          </span>
        ) : null}
      </div>
    </Link>
  );
}
