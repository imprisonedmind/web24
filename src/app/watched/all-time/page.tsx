import { Suspense } from "react";

import {
  getMostWatchedAllTime,
  type WatchCarouselItem
} from "@/app/activity/actions/getWatchHighlights";
import Breadcrumbs from "@/components/breadcrumbs";
import { WatchCard } from "@/components/tv/watchCard";
import { WatchGridSkeleton } from "@/components/tv/watchGridSkeleton";

export default function WatchedAllTimePage() {
  return (
    <div className="mx-auto mb-8 flex w-full max-w-[960px] flex-col gap-8 py-4 px-[calc(min(16px,8vw))] sm:px-0">
      <Breadcrumbs />

      <Suspense fallback={<WatchGridSkeleton />}>
        <AllTimeWatchGrid />
      </Suspense>
    </div>
  );
}

async function AllTimeWatchGrid() {
  const items = await getMostWatchedAllTime(60);
  return (
    <WatchGrid
      items={items}
      emptyMessage="No all-time watch stats found."
    />
  );
}

function WatchGrid({
  items,
  emptyMessage
}: {
  items: WatchCarouselItem[];
  emptyMessage: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-600">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(item => (
        <WatchCard key={item.id} item={item} />
      ))}
    </div>
  );
}
