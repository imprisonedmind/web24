import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { ActivitySection, TelevisionActivityHeader } from "../components/activity";
import { Breadcrumbs } from "../components/breadcrumbs";
import { activityWatchingQueryOptions, activityWorkQueryOptions } from "../lib/api";

function ActivitySectionLoading({
  title,
  header,
}: {
  title: string;
  header?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      {header ?? <div className="text-sm lowercase text-neutral-500">{title}</div>}
      <div className="flex min-h-[108px] items-center rounded-lg bg-white p-4 text-sm text-neutral-500 shadow-sm">
        Loading…
      </div>
    </section>
  );
}

export function ActivityPage() {
  const {
    data: watchingDays = [],
    isLoading: isWatchingLoading,
  } = useQuery(activityWatchingQueryOptions);
  const {
    data: workSections = [],
    isLoading: isWorkLoading,
  } = useQuery(activityWorkQueryOptions);

  return (
    <section className="mb-8 flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4 sm:px-0">
      <Breadcrumbs />

      {isWatchingLoading ? (
        <ActivitySectionLoading
          title="watching"
          header={<TelevisionActivityHeader />}
        />
      ) : (
        <ActivitySection
          title="watching"
          days={watchingDays}
          header={<TelevisionActivityHeader />}
          emptyMessage="No watch activity available."
        />
      )}

      {isWorkLoading
        ? ["coding", "writing"].map(label => (
            <ActivitySectionLoading key={label} title={label} />
          ))
        : workSections.map(section => (
            <ActivitySection
              key={section.label}
              title={section.label}
              days={section.days}
            />
          ))}
    </section>
  );
}
