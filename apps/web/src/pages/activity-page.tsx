import { useQuery } from "@tanstack/react-query";

import {
  ActivitySection,
  ActivitySectionLoading,
  TelevisionActivityHeader,
} from "../components/activity";
import { Breadcrumbs } from "../components/breadcrumbs";
import { activityWatchingQueryOptions, activityWorkQueryOptions } from "../lib/api";

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
