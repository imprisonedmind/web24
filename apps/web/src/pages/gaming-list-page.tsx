import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "../components/breadcrumbs";
import { GamingGrid } from "../components/gaming";
import { gamingListQueryOptions } from "../lib/api";
import { queryClient } from "../lib/query-client";

const GAMING_PAGE_CONFIG = {
  recent: {
    emptyMessage: "No recent gaming history available.",
    limit: 48,
  },
  month: {
    emptyMessage: "No play time recorded in the last 30 days.",
    limit: 48,
  },
  "all-time": {
    emptyMessage: "No all-time gaming stats found.",
    limit: 60,
  },
} as const;

export function GamingListPage({
  scope,
}: {
  scope: keyof typeof GAMING_PAGE_CONFIG;
}) {
  const config = GAMING_PAGE_CONFIG[scope];
  const { data = [] } = useSuspenseQuery(gamingListQueryOptions(scope, config.limit));

  return (
    <section className="mb-8 flex flex-col gap-8 pb-4">
      <Breadcrumbs />
      <GamingGrid items={data} emptyMessage={config.emptyMessage} />
    </section>
  );
}

export async function preloadGamingListPage(scope: keyof typeof GAMING_PAGE_CONFIG) {
  const config = GAMING_PAGE_CONFIG[scope];
  await queryClient.ensureQueryData(gamingListQueryOptions(scope, config.limit));
}
