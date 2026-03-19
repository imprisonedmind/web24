import type { WatchedItem } from "../types";
import { withTmdbPosterSize } from "../lib/media-image";
import { CFImage } from "./cf-image";
import { SmallLink } from "./legacy";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

export function WatchCard({ item }: { item: WatchedItem }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="group block overflow-hidden rounded-lg bg-neutral-100"
      >
        <div className="relative aspect-[2/3] w-full">
          <CFImage
            src={withTmdbPosterSize(item.posterUrl, "w342")}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>
      </a>

      <div className="flex flex-col gap-1">
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-neutral-900 transition hover:text-neutral-700"
        >
          <span className="line-clamp-2">{item.title}</span>
        </a>

        {item.subtitle ? (
          <p className="line-clamp-2 text-xs text-neutral-500">{item.subtitle}</p>
        ) : null}

        {item.meta ? <p className="text-xs text-neutral-400">{item.meta}</p> : null}
      </div>
    </div>
  );
}

export function WatchGrid({
  items,
  emptyMessage
}: {
  items: WatchedItem[];
  emptyMessage: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-600">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {items.map(item => (
        <WatchCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function WatchCarouselSection({
  title,
  items,
  links = [],
  emptyMessage
}: {
  title: string;
  items: WatchedItem[];
  links?: { title: string; href: string }[];
  emptyMessage?: string;
}) {
  if (!items.length) {
    return emptyMessage ? (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {title}
          </h2>
          {links.length ? (
            <div className="flex items-center gap-3">
              {links.map(link => (
                <SmallLink key={link.href} href={link.href} label={link.title} />
              ))}
            </div>
          ) : null}
        </div>
        <p className="text-sm text-neutral-600">{emptyMessage}</p>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {title}
        </h2>
        {links.length ? (
          <div className="flex items-center gap-3">
            {links.map(link => (
              <SmallLink key={link.href} href={link.href} label={link.title} />
            ))}
          </div>
        ) : null}
      </div>

      <Carousel opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="gap-3 p-2 px-0 sm:px-0">
          {items.map((item) => (
            <CarouselItem key={item.id} className="basis-auto pl-0">
              <div className="w-32 sm:w-40">
                <WatchCard item={item} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden h-7 w-7 sm:flex" />
        <CarouselNext className="hidden h-7 w-7 sm:flex" />
      </Carousel>
    </div>
  );
}

export function WatchCarouselSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
          {title}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map(index => (
          <div
            key={index}
            className="h-48 w-32 flex-shrink-0 animate-pulse rounded-lg bg-neutral-200 sm:h-56 sm:w-40"
          />
        ))}
      </div>
    </div>
  );
}

export function WatchGridSkeleton({
  itemsPerRow = 4,
  total = 12
}: {
  itemsPerRow?: number;
  total?: number;
}) {
  const rows = Math.ceil(total / itemsPerRow);
  const items = Array.from({ length: rows * itemsPerRow });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-neutral-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}
