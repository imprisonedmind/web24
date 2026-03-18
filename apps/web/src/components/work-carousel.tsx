import type { WorkItem } from "@web24/content";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { WorkCard } from "./work-card";

interface WorkCarouselProps {
  items: WorkItem[];
}

export function WorkCarousel({ items }: WorkCarouselProps) {
  if (!items.length) {
    return (
      <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
        Nothing to show here just yet.
      </p>
    );
  }

  return (
    <Carousel opts={{ align: "start", dragFree: true }}>
      <CarouselContent className="gap-2 p-2 px-4">
        {items.map((item, index) => (
          <CarouselItem key={`${item.link}-${index}`} className="basis-auto pl-0">
            <WorkCard item={item} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden h-7 w-7 sm:flex" />
      <CarouselNext className="hidden h-7 w-7 sm:flex" />
    </Carousel>
  );
}
