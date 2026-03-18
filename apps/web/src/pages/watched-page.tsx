import { useQuery } from "@tanstack/react-query";

import { MediaCard } from "../components/legacy";
import { WatchCarouselSection, WatchCarouselSkeleton } from "../components/watched";
import { watchedOverviewQueryOptions } from "../lib/api";

export function WatchedPage() {
  const {
    data = {
      recentItems: [],
      monthItems: [],
      allTimeItems: [],
    },
    isLoading,
  } = useQuery(watchedOverviewQueryOptions);

  const { recentItems, monthItems, allTimeItems } = data;

  return (
    <section className="mb-8 flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4 sm:px-0">
      {isLoading && !recentItems.length && !monthItems.length && !allTimeItems.length ? (
        <>
          <WatchCarouselSkeleton title="recently watched" />
          <WatchCarouselSkeleton title="most watched this month" />
          <WatchCarouselSkeleton title="most watched all time" />
        </>
      ) : recentItems.length || monthItems.length || allTimeItems.length ? (
        <>
          <WatchCarouselSection
            title="recently watched"
            items={recentItems}
            links={[{ title: "all", href: "/watched/recent" }]}
            emptyMessage="No recent watch history available."
          />
          <WatchCarouselSection
            title="most watched this month"
            items={monthItems}
            links={[{ title: "all", href: "/watched/month" }]}
            emptyMessage="No watch time recorded in the last 30 days."
          />
          <WatchCarouselSection
            title="most watched all time"
            items={allTimeItems}
            links={[{ title: "all", href: "/watched/all-time" }]}
            emptyMessage="No all-time watch stats found."
          />
        </>
      ) : (
        <MediaCard className="max-w-[44rem] p-5 md:p-6">
          <p className="m-0 text-[#425348]">No recent watched data available.</p>
        </MediaCard>
      )}
    </section>
  );
}
