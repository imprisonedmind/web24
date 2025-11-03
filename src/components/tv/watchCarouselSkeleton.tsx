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
