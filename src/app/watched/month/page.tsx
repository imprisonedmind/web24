import { Suspense } from "react";

import {
  getMostWatchedPast30Days,
  type WatchCarouselItem
} from "@/app/activity/actions/getWatchHighlights";
import Breadcrumbs from "@/components/breadcrumbs";
import { WatchCard } from "@/components/tv/watchCard";
import { WatchGridSkeleton } from "@/components/tv/watchGridSkeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function WatchedMonthPage() {
  return (
    <PageContainer className="mb-8 flex flex-col gap-8 py-4 px-[calc(min(16px,8vw))] sm:px-0">
      <Breadcrumbs />

      <Suspense fallback={<WatchGridSkeleton />}>
        <MonthlyWatchGrid />
      </Suspense>
    </PageContainer>
  );
}

async function MonthlyWatchGrid() {
  const items = await getMostWatchedPast30Days(48);
  return (
    <WatchGrid
      items={items}
      emptyMessage="No watch time recorded in the last 30 days."
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
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {items.map(item => (
        <WatchCard key={item.id} item={item} />
      ))}
    </div>
  );
}
