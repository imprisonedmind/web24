import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { WorkCard } from "@/components/workCard";
import { type WorkCardData } from "@/lib/workData";

interface WorkCarouselProps {
  items: WorkCardData[];
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
          <CarouselItem
            key={`${item.link}-${index}`}
            className="basis-auto pl-0"
          >
            <WorkCard
              title={item.title}
              link={item.link}
              tag={item.tag}
              src={item.src}
              alt={item.alt}
              internal={item.internal}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden h-7 w-7 sm:flex" />
      <CarouselNext className="hidden h-7 w-7 sm:flex" />
    </Carousel>
  );
}
