import { Suspense } from "react";

import Breadcrumbs from "@/components/breadcrumbs";
import RecentlyWatchedCarousel from "@/components/tv/recentlyWatchedCarousel";
import MonthlyMostWatchedCarousel from "@/components/tv/monthlyMostWatchedCarousel";
import AllTimeWatchedCarousel from "@/components/tv/allTimeWatchedCarousel";
import { WatchCarouselSkeleton } from "@/components/tv/watchCarouselSkeleton";
import { PageContainer } from "@/components/ui/page-container";
import { createMetadata, createSeoProps, type CreateMetadataOptions } from "@/lib/seo";
import { Seo } from "@/components/seo/seo";

const WATCHED_SEO: CreateMetadataOptions = {
  title: "Watching Dashboard | Luke Stephens",
  description:
    "Browse Luke Stephens' recently watched shows, monthly highlights, and all-time television favorites.",
  path: "/watched"
};

export const metadata = createMetadata(WATCHED_SEO);
const watchedSeo = createSeoProps(WATCHED_SEO);

export default function WatchedPage() {
  return (
    <PageContainer className="mb-8 flex flex-col gap-8 py-4 px-[calc(min(16px,8vw))] sm:px-0">
      <Seo {...watchedSeo} />
      <Breadcrumbs />

      <div className="flex flex-col gap-8">
        <Suspense fallback={<WatchCarouselSkeleton title="recently watched" />}>
          <RecentlyWatchedCarousel />
        </Suspense>

        <Suspense
          fallback={<WatchCarouselSkeleton title="most watched this month" />}
        >
          <MonthlyMostWatchedCarousel />
        </Suspense>

        <Suspense
          fallback={<WatchCarouselSkeleton title="most watched all time" />}
        >
          <AllTimeWatchedCarousel />
        </Suspense>
      </div>
    </PageContainer>
  );
}
