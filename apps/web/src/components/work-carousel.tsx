import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type { WorkItem } from "@web24/content";

type WorkCarouselProps = {
  items: WorkItem[];
};

function WorkCard({ item }: { item: WorkItem }) {
  return (
    <a
      href={item.link}
      target={item.internal ? "_self" : "_blank"}
      rel={item.internal ? undefined : "noreferrer"}
      className="flex min-w-[185px] flex-col gap-2 rounded-xl bg-white p-2 shadow-sm transition duration-150 ease-in-out hover:shadow-md"
    >
      <div className="relative h-36 w-full overflow-hidden rounded-lg">
        <img
          src={item.image}
          alt={item.alt}
          className="h-full w-full bg-gray-200 object-cover"
        />
      </div>
      <div className="flex justify-between gap-2">
        <p className="text-sm">{item.title}</p>
        <p className="rounded-full bg-neutral-100 p-1 px-2 text-xs">{item.tag}</p>
      </div>
    </a>
  );
}

export function WorkCarousel({ items }: WorkCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
    };
  }, [emblaApi, updateButtons]);

  if (!items.length) {
    return (
      <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
        Nothing to show here just yet.
      </p>
    );
  }

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-2 p-2 px-4">
          {items.map((item, index) => (
            <div key={`${item.link}-${index}`} className="min-w-0 shrink-0 grow-0 basis-auto">
              <WorkCard item={item} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        className="absolute -left-12 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm disabled:opacity-50 sm:flex"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        className="absolute -right-12 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm disabled:opacity-50 sm:flex"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
