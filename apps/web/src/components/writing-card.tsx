import { Link } from "@tanstack/react-router";
import type { WritingPost } from "@web24/content";
import { getWritingRoutePath } from "@web24/content";

import { CFImage } from "./cf-image";
import { ReviewScore } from "./review-score";

export function WritingCard({ item }: { item: WritingPost }) {
  return (
    <Link
      to={getWritingRoutePath(item)}
      className="flex w-full flex-col gap-4 overflow-clip rounded-xl bg-white p-2 shadow-sm transition duration-300 ease-in-out hover:shadow-md"
    >
      <CFImage
        src={`/${item.openGraph}`}
        alt={item.title}
        className="max-h-[160px] w-full rounded-lg bg-gray-200 object-cover"
        widths={[320, 640, 960]}
        sizes="(max-width: 768px) 100vw, 640px"
      />

      <div className="flex flex-col gap-1 px-1 pb-2 !pt-0">
        <div className="flex flex-row items-center justify-between">
          <p className="line-clamp-1 font-medium">{item.title}</p>
          <p className="flex-shrink-0 text-xs">{item.date}</p>
        </div>

        <p className="line-clamp-3 text-sm text-neutral-500">{item.description}</p>

        {item.score !== undefined ? (
          <span className="mt-1">
            <ReviewScore score={item.score} />
          </span>
        ) : null}
      </div>
    </Link>
  );
}
