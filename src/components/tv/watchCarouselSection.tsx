import { type WatchCarouselItem } from "@/app/activity/actions/getWatchHighlights";
import { SmallLink } from "@/components/smallLink";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { WatchCard } from "@/components/tv/watchCard";

type Link = { title: string; href: string };

interface WatchCarouselSectionProps {
  title: string;
  items: WatchCarouselItem[];
  links?: Link[];
  emptyMessage?: string;
}

export function WatchCarouselSection({
  title,
  items,
  links = [],
  emptyMessage
}: WatchCarouselSectionProps) {
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
                <SmallLink key={link.href} link={link.href} title={link.title} />
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
              <SmallLink key={link.href} link={link.href} title={link.title} />
            ))}
          </div>
        ) : null}
      </div>

      <Carousel opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="-ml-3">
          {items.map(item => (
            <CarouselItem
              key={item.id}
              className="basis-1/2 pl-3 sm:basis-1/3 lg:basis-1/4"
            >
              <WatchCard item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden h-7 w-7 sm:flex" />
        <CarouselNext className="hidden h-7 w-7 sm:flex" />
      </Carousel>
    </div>
  );
}
