import { useSuspenseQueries } from "@tanstack/react-query";

import { Breadcrumbs } from "../components/breadcrumbs";
import { WatchCarouselSection } from "../components/watched";
import { watchedMonthlyQueryOptions } from "../lib/api";
import { queryClient } from "../lib/query-client";
import type { WatchedItem } from "../types";

function getMonthStartIso(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

function formatMonthLabel(monthIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(monthIso));
}

function subMonthsUtc(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1, 0, 0, 0));
}

function MonthlySection({
  monthIso,
  items,
}: {
  monthIso: string;
  items: WatchedItem[];
}) {
  const label = formatMonthLabel(monthIso);

  return (
    <WatchCarouselSection
      title={label}
      items={items}
      emptyMessage={`No watch activity recorded in ${label}.`}
    />
  );
}

export function WatchedMonthsPage() {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => getMonthStartIso(subMonthsUtc(now, index)));
  const results = useSuspenseQueries({
    queries: months.map((monthIso) => watchedMonthlyQueryOptions(monthIso, 12)),
  });

  return (
    <section className="mb-8 flex flex-col gap-8 pb-4">
      <Breadcrumbs />

      <div className="flex flex-col gap-10">
        {months.map((monthIso, index) => (
          <MonthlySection key={monthIso} monthIso={monthIso} items={results[index]?.data ?? []} />
        ))}
      </div>
    </section>
  );
}

export async function preloadWatchedMonthsPage() {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => getMonthStartIso(subMonthsUtc(now, index)));

  await Promise.all(
    months.map((monthIso) => queryClient.ensureQueryData(watchedMonthlyQueryOptions(monthIso, 12))),
  );
}
