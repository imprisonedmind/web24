import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "../components/breadcrumbs";
import { GamingCarouselSection } from "../components/gaming";
import { MediaCard } from "../components/legacy";
import { gamingOverviewQueryOptions } from "../lib/api";
import { queryClient } from "../lib/query-client";

export function GamingPage() {
  const {
    data = {
      recentItems: [],
      monthItems: [],
      allTimeItems: [],
    },
  } = useSuspenseQuery(gamingOverviewQueryOptions);

  const { recentItems, monthItems, allTimeItems } = data;

  return (
    <section className="mb-8 flex flex-col gap-8 pb-4">
      <Breadcrumbs />

      {recentItems.length || monthItems.length || allTimeItems.length ? (
        <div className="flex flex-col gap-8">
          <GamingCarouselSection
            title="recently played"
            items={recentItems}
            links={[{ title: "all", href: "/gaming/recent" }]}
            emptyMessage="No recent gaming history available."
          />
          <GamingCarouselSection
            title="most played this month"
            items={monthItems}
            links={[{ title: "all", href: "/gaming/month" }]}
            emptyMessage="No play time recorded in the last 30 days."
          />
          <GamingCarouselSection
            title="most played all time"
            items={allTimeItems}
            links={[{ title: "all", href: "/gaming/all-time" }]}
            emptyMessage="No all-time gaming stats found."
          />
        </div>
      ) : (
        <MediaCard className="max-w-[44rem] p-5 md:p-6">
          <p className="m-0 text-[#425348]">No recent gaming data available.</p>
        </MediaCard>
      )}
    </section>
  );
}

export async function preloadGamingPage() {
  await queryClient.ensureQueryData(gamingOverviewQueryOptions);
}
