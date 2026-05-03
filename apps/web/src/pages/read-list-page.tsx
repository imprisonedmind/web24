import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "../components/breadcrumbs";
import { ReadingGrid } from "../components/reading";
import { readingListQueryOptions } from "../lib/api";
import { queryClient } from "../lib/query-client";

const READ_PAGE_CONFIG = {
  current: {
    emptyMessage: "No current books available.",
    limit: 48,
  },
  finished: {
    emptyMessage: "No finished books available.",
    limit: 60,
  },
  sessions: {
    emptyMessage: "No reading sessions available.",
    limit: 60,
  },
} as const;

export function ReadListPage({
  scope,
}: {
  scope: keyof typeof READ_PAGE_CONFIG;
}) {
  const config = READ_PAGE_CONFIG[scope];
  const { data = [] } = useSuspenseQuery(readingListQueryOptions(scope, config.limit));

  return (
    <section className="mb-8 flex flex-col gap-8 pb-4">
      <Breadcrumbs />
      <ReadingGrid items={data} emptyMessage={config.emptyMessage} />
    </section>
  );
}

export async function preloadReadListPage(scope: keyof typeof READ_PAGE_CONFIG) {
  const config = READ_PAGE_CONFIG[scope];
  await queryClient.ensureQueryData(readingListQueryOptions(scope, config.limit));
}
