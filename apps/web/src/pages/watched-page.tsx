import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "../components/breadcrumbs";
import { MediaCard } from "../components/legacy";
import { WatchCarouselSection } from "../components/watched";
import { watchedOverviewQueryOptions } from "../lib/api";
import { queryClient } from "../lib/query-client";

export function WatchedPage() {
  const {
    data = {
      recentItems: [],
      monthItems: [],
      allTimeItems: [],
    },
  } = useSuspenseQuery(watchedOverviewQueryOptions);

  const { recentItems, monthItems, allTimeItems } = data;

  return (
    <section className="mb-8 flex flex-col gap-8 pb-4">
      <Breadcrumbs />

      {recentItems.length || monthItems.length || allTimeItems.length ? (
        <div className="flex flex-col gap-8">
          <WatchCarouselSection
            title="recently watched"
            items={recentItems}
            links={[{ title: "all", href: "/watched/recent" }]}
            emptyMessage="No recent watch history available."
          />
          <WatchCarouselSection
            title="most watched this month"
            items={monthItems}
            links={[
              { title: "all", href: "/watched/month" },
              { title: "all months", href: "/watched/months" },
            ]}
            emptyMessage="No watch time recorded in the last 30 days."
          />
          <WatchCarouselSection
            title="most watched all time"
            items={allTimeItems}
            links={[{ title: "all", href: "/watched/all-time" }]}
            emptyMessage="No all-time watch stats found."
          />
        </div>
      ) : (
        <MediaCard className="max-w-[44rem] p-5 md:p-6">
          <p className="m-0 text-[#425348]">No recent watched data available.</p>
        </MediaCard>
      )}
    </section>
  );
}

export async function preloadWatchedPage() {
  await queryClient.ensureQueryData(watchedOverviewQueryOptions);
}
