interface WatchGridSkeletonProps {
  itemsPerRow?: number;
  total?: number;
}

export function WatchGridSkeleton({
  itemsPerRow = 4,
  total = 12
}: WatchGridSkeletonProps) {
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
