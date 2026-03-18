import { useQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "../components/breadcrumbs";
import { WatchCarouselSection, WatchCarouselSkeleton } from "../components/watched";
import { watchedMonthlyQueryOptions } from "../lib/api";

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

function MonthlySection({ monthIso }: { monthIso: string }) {
  const label = formatMonthLabel(monthIso);
  const { data = [], isLoading } = useQuery(watchedMonthlyQueryOptions(monthIso, 12));

  if (isLoading && !data.length) {
    return <WatchCarouselSkeleton title={label} />;
  }

  return (
    <WatchCarouselSection
      title={label}
      items={data}
      emptyMessage={`No watch activity recorded in ${label}.`}
    />
  );
}

export function WatchedMonthsPage() {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => getMonthStartIso(subMonthsUtc(now, index)));

  return (
    <section className="mb-8 flex flex-col gap-8 pb-4">
      <Breadcrumbs />

      <div className="flex flex-col gap-10">
        {months.map((monthIso) => (
          <MonthlySection key={monthIso} monthIso={monthIso} />
        ))}
      </div>
    </section>
  );
}
