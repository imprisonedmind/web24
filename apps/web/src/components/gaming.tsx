import type { GamingItem } from "../types";
import { CFImage } from "./cf-image";
import { SmallLink } from "./legacy";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

export function GamingCard({ item }: { item: GamingItem }) {
  const content = item.coverUrl ? (
    <CFImage
      src={item.coverUrl}
      alt={item.title}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      unoptimized
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 p-4 text-center text-sm font-medium text-neutral-700">
      <span className="line-clamp-4">{item.title}</span>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="group overflow-hidden rounded-lg bg-neutral-100">
        <div className="relative aspect-[2/3] w-full">{content}</div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-neutral-900">
          <span className="line-clamp-2">{item.title}</span>
        </p>
        {item.meta ? <p className="text-xs text-neutral-400">{item.meta}</p> : null}
      </div>
    </div>
  );
}

export function GamingGrid({
  items,
  emptyMessage,
}: {
  items: GamingItem[];
  emptyMessage: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-600">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {items.map(item => (
        <GamingCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function GamingCarouselSection({
  title,
  items,
  links = [],
  emptyMessage,
}: {
  title: string;
  items: GamingItem[];
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
                <GamingCard item={item} />
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
