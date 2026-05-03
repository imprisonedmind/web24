import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "../components/breadcrumbs";
import { MediaCard } from "../components/legacy";
import { ReadingCarouselSection } from "../components/reading";
import { readingOverviewQueryOptions } from "../lib/api";
import { queryClient } from "../lib/query-client";

export function ReadPage() {
  const {
    data = {
      currentItems: [],
      finishedItems: [],
      sessionItems: [],
    },
  } = useSuspenseQuery(readingOverviewQueryOptions);

  const { currentItems = [], finishedItems = [], sessionItems = [] } = data;

  return (
    <section className="mb-8 flex flex-col gap-8 pb-4">
      <Breadcrumbs />

      {currentItems.length || sessionItems.length || finishedItems.length ? (
        <div className="flex flex-col gap-8">
          <ReadingCarouselSection
            title="currently reading"
            items={currentItems}
            links={[{ title: "all", href: "/read/current" }]}
            emptyMessage="No current books available."
          />
          <ReadingCarouselSection
            title="recent sessions"
            items={sessionItems}
            links={[{ title: "all", href: "/read/sessions" }]}
            emptyMessage="No reading sessions available."
          />
          <ReadingCarouselSection
            title="finished books"
            items={finishedItems}
            links={[{ title: "all", href: "/read/finished" }]}
            emptyMessage="No finished books available."
          />
        </div>
      ) : (
        <MediaCard className="max-w-[44rem] p-5 md:p-6">
          <p className="m-0 text-[#425348]">No reading data available.</p>
        </MediaCard>
      )}
    </section>
  );
}

export async function preloadReadPage() {
  await queryClient.ensureQueryData(readingOverviewQueryOptions);
}
