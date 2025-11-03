import Image from "next/image";

import { type WatchCarouselItem } from "@/app/activity/actions/getWatchHighlights";

interface WatchCardProps {
  item: WatchCarouselItem;
}

export function WatchCard({ item }: WatchCardProps) {
  return (
    <div className="flex h-full flex-col gap-2">
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-lg bg-neutral-100"
      >
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={item.posterUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 180px, (min-width: 640px) 240px, 80vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </a>

      <div className="flex flex-col gap-1">
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-neutral-900 transition hover:text-neutral-700"
        >
          <span className="line-clamp-2">{item.title}</span>
        </a>

        {item.subtitle ? (
          <p className="line-clamp-2 text-xs text-neutral-500">
            {item.subtitle}
          </p>
        ) : null}

        {item.meta ? (
          <p className="text-xs text-neutral-400">{item.meta}</p>
        ) : null}
      </div>
    </div>
  );
}
