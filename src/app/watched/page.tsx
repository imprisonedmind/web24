import { Suspense } from "react";

import Breadcrumbs from "@/components/breadcrumbs";
import RecentlyWatchedCarousel from "@/components/tv/recentlyWatchedCarousel";
import MonthlyMostWatchedCarousel from "@/components/tv/monthlyMostWatchedCarousel";
import AllTimeWatchedCarousel from "@/components/tv/allTimeWatchedCarousel";
import { WatchCarouselSkeleton } from "@/components/tv/watchCarouselSkeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function WatchedPage() {
  return (
    <PageContainer className="mb-8 flex flex-col gap-8 py-4 px-[calc(min(16px,8vw))] sm:px-0">
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
