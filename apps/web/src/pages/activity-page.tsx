import { useQuery } from "@tanstack/react-query";

import { ActivitySection, TelevisionActivityHeader } from "../components/activity";
import { WatchCarouselSkeleton } from "../components/watched";
import { fullActivityQueryOptions } from "../lib/api";

export function ActivityPage() {
  const { data: days = [], isLoading } = useQuery(fullActivityQueryOptions);

  return (
    <section className="mb-8 flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4 sm:px-0">
      {isLoading && !days.length ? (
        <WatchCarouselSkeleton title="watching" />
      ) : (
        <ActivitySection
          title="watching"
          days={days}
          header={<TelevisionActivityHeader />}
          emptyMessage="No watch activity available."
        />
      )}
    </section>
  );
}
