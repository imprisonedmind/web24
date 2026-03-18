import { useQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "../components/breadcrumbs";
import { WatchGrid, WatchGridSkeleton } from "../components/watched";
import { watchedListQueryOptions } from "../lib/api";

const WATCHED_PAGE_CONFIG = {
  recent: {
    title: "recently watched",
    emptyMessage: "No recent watch history available.",
    limit: 48,
  },
  month: {
    title: "most watched this month",
    emptyMessage: "No watch time recorded in the last 30 days.",
    limit: 48,
  },
  "all-time": {
    title: "most watched all time",
    emptyMessage: "No all-time watch stats found.",
    limit: 60,
  },
} as const;

export function WatchedListPage({
  scope,
}: {
  scope: keyof typeof WATCHED_PAGE_CONFIG;
}) {
  const config = WATCHED_PAGE_CONFIG[scope];
  const { data = [], isLoading } = useQuery(watchedListQueryOptions(scope, config.limit));

  return (
    <section className="mb-8 flex flex-col gap-8 pb-4">
      <Breadcrumbs />

      {isLoading && !data.length ? (
        <WatchGridSkeleton total={scope === "all-time" ? 12 : 12} />
      ) : (
        <WatchGrid items={data} emptyMessage={config.emptyMessage} />
      )}
    </section>
  );
}
