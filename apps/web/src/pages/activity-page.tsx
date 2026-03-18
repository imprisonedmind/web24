import { useQuery } from "@tanstack/react-query";

import { ActivitySection, TelevisionActivityHeader } from "../components/activity";
import { Breadcrumbs } from "../components/breadcrumbs";
import { WatchCarouselSkeleton } from "../components/watched";
import { fullActivityQueryOptions } from "../lib/api";

export function ActivityPage() {
  const {
    data = {
      watchingDays: [],
      workSections: []
    },
    isLoading
  } = useQuery(fullActivityQueryOptions);
  const watchingDays = data.watchingDays ?? [];
  const workSections = data.workSections ?? [];

  return (
    <section className="mb-8 flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4 sm:px-0">
      <Breadcrumbs />

      {isLoading && !watchingDays.length ? (
        <WatchCarouselSkeleton title="watching" />
      ) : (
        <ActivitySection
          title="watching"
          days={watchingDays}
          header={<TelevisionActivityHeader />}
          emptyMessage="No watch activity available."
        />
      )}

      {isLoading && !workSections.length
        ? ["coding", "writing", "designing", "meeting", "browsing"].map(title => (
            <WatchCarouselSkeleton key={title} title={title} />
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
