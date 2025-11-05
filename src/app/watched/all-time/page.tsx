import { Suspense } from "react";

import {
  getMostWatchedAllTime,
  type WatchCarouselItem
} from "@/app/activity/actions/getWatchHighlights";
import Breadcrumbs from "@/components/breadcrumbs";
import { WatchCard } from "@/components/tv/watchCard";
import { WatchGridSkeleton } from "@/components/tv/watchGridSkeleton";
import { PageContainer } from "@/components/ui/page-container";
import { createMetadata, createSeoProps, type CreateMetadataOptions } from "@/lib/seo";
import { Seo } from "@/components/seo/seo";

const ALL_TIME_SEO: CreateMetadataOptions = {
  title: "All-Time Favorites | Luke Stephens",
  description:
    "A curated grid of the most watched shows and films by Luke Stephens, ranked by total watch time.",
  path: "/watched/all-time"
};

export const metadata = createMetadata(ALL_TIME_SEO);
const allTimeSeo = createSeoProps(ALL_TIME_SEO);

export default function WatchedAllTimePage() {
  return (
    <PageContainer className="mb-8 flex flex-col gap-8 py-4 px-[calc(min(16px,8vw))] sm:px-0">
      <Seo {...allTimeSeo} />
      <Breadcrumbs />

      <Suspense fallback={<WatchGridSkeleton />}>
        <AllTimeWatchGrid />
      </Suspense>
    </PageContainer>
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
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {items.map(item => (
        <WatchCard key={item.id} item={item} />
      ))}
    </div>
  );
}
