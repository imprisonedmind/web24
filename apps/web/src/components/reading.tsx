import type { ReadingItem } from "../types";
import { CFImage } from "./cf-image";
import { SmallLink } from "./legacy";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

function fallbackBookCover(item: ReadingItem) {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-[#db2777] p-4 text-white">
      <div className="h-1 w-10 rounded-full bg-white/70" />
      <div className="flex flex-col gap-2">
        <p className="line-clamp-4 text-base font-semibold leading-tight">{item.title}</p>
        {item.subtitle ? <p className="line-clamp-2 text-xs text-white/80">{item.subtitle}</p> : null}
      </div>
      <div className="h-1 w-16 rounded-full bg-white/70" />
    </div>
  );
}

export function ReadingCard({ item }: { item: ReadingItem }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="group block overflow-hidden rounded-lg bg-neutral-100"
      >
        <div className="relative aspect-[2/3] w-full">
          {item.coverUrl ? (
            <CFImage
              src={item.coverUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            fallbackBookCover(item)
          )}
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

        {item.subtitle ? <p className="line-clamp-2 text-xs text-neutral-500">{item.subtitle}</p> : null}
        {item.meta ? <p className="text-xs text-neutral-400">{item.meta}</p> : null}
      </div>
    </div>
  );
}

export function ReadingGrid({
  items,
  emptyMessage,
}: {
  items: ReadingItem[];
  emptyMessage: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-600">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {items.map(item => (
        <ReadingCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function ReadingCarouselSection({
  title,
  items,
  links = [],
  emptyMessage,
}: {
  title: string;
  items: ReadingItem[];
  links?: { title: string; href: string }[];
  emptyMessage?: string;
}) {
  if (!items.length) {
    return emptyMessage ? (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
          {links.length ? (
            <div className="flex items-center gap-3">
              {links.map(link => <SmallLink key={link.href} href={link.href} label={link.title} />)}
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
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
        {links.length ? (
          <div className="flex items-center gap-3">
            {links.map(link => <SmallLink key={link.href} href={link.href} label={link.title} />)}
          </div>
        ) : null}
      </div>

      <Carousel opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="gap-3 p-2 px-0 sm:px-0">
          {items.map(item => (
            <CarouselItem key={item.id} className="basis-auto pl-0">
              <div className="w-32 sm:w-40">
                <ReadingCard item={item} />
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
