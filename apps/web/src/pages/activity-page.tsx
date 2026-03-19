import { useSuspenseQuery } from "@tanstack/react-query";

import { ActivitySection, TelevisionActivityHeader } from "../components/activity";
import { Breadcrumbs } from "../components/breadcrumbs";
import { fullActivityQueryOptions } from "../lib/api";
import { queryClient } from "../lib/query-client";

export function ActivityPage() {
  const {
    data = {
      watchingDays: [],
      workSections: []
    },
  } = useSuspenseQuery(fullActivityQueryOptions);
  const watchingDays = data.watchingDays ?? [];
  const workSections = data.workSections ?? [];

  return (
    <section className="mb-8 flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4 sm:px-0">
      <Breadcrumbs />

      <ActivitySection
        title="watching"
        days={watchingDays}
        header={<TelevisionActivityHeader />}
        emptyMessage="No watch activity available."
      />

      {workSections.map(section => (
        <ActivitySection
          key={section.label}
          title={section.label}
          days={section.days}
        />
      ))}
    </section>
  );
}

export async function preloadActivityPage() {
  await queryClient.ensureQueryData(fullActivityQueryOptions);
}
