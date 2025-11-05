import { Suspense } from "react";

import {
  getRecentlyWatched,
  type WatchCarouselItem
} from "@/app/activity/actions/getWatchHighlights";
import Breadcrumbs from "@/components/breadcrumbs";
import { WatchCard } from "@/components/tv/watchCard";
import { WatchGridSkeleton } from "@/components/tv/watchGridSkeleton";
import { PageContainer } from "@/components/ui/page-container";
import { createMetadata, createSeoProps, type CreateMetadataOptions } from "@/lib/seo";
import { Seo } from "@/components/seo/seo";

const RECENT_SEO: CreateMetadataOptions = {
  title: "Recently Watched | Luke Stephens",
  description:
    "See the latest shows and films Luke Stephens watched, complete with posters and quick links.",
  path: "/watched/recent"
};

export const metadata = createMetadata(RECENT_SEO);
const recentSeo = createSeoProps(RECENT_SEO);

export default function WatchedRecentPage() {
  return (
    <PageContainer className="mb-8 flex flex-col gap-8 py-4 px-[calc(min(16px,8vw))] sm:px-0">
      <Seo {...recentSeo} />
      <Breadcrumbs />

      <Suspense fallback={<WatchGridSkeleton />}>
        <RecentWatchGrid />
      </Suspense>
    </PageContainer>
  );
}

async function RecentWatchGrid() {
  const items = await getRecentlyWatched(48);
  return (
    <WatchGrid
      items={items}
      emptyMessage="No recent watch history available."
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
