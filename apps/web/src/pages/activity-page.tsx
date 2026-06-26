import { useQuery } from "@tanstack/react-query";

import {
  ActivitySection,
  ActivitySectionLoading,
  TelevisionActivityHeader,
} from "../components/activity";
import { Breadcrumbs } from "../components/breadcrumbs";
import {
  activityHealthQueryOptions,
  activityReadingQueryOptions,
  activityWatchingQueryOptions,
  activityWorkQueryOptions,
  activityGamingQueryOptions,
} from "../lib/api";

export function ActivityPage() {
  const {
    data: watchingDays = [],
    isLoading: isWatchingLoading,
  } = useQuery(activityWatchingQueryOptions);
  const {
    data: workSections = [],
    isLoading: isWorkLoading,
  } = useQuery(activityWorkQueryOptions);
  const {
    data: healthSections = [],
    isLoading: isHealthLoading,
  } = useQuery(activityHealthQueryOptions);
  const {
    data: readingSections = [],
    isLoading: isReadingLoading,
  } = useQuery(activityReadingQueryOptions);
  const { data: gamingSections = [], isLoading: isGamingLoading } = useQuery(activityGamingQueryOptions);
  const sleepSection = healthSections.find(section => section.label === "sleep");
  const exerciseSection = healthSections.find(section => section.label === "exercise");
  const codingSection = workSections.find(section => section.label === "coding");
  const remainingWorkSections = workSections.filter(section => section.label !== "coding");

  return (
    <section className="mb-8 flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4 sm:px-0">
      <Breadcrumbs />

      {isHealthLoading ? (
        <ActivitySectionLoading title="sleep" />
      ) : sleepSection ? (
        <ActivitySection title={sleepSection.label} days={sleepSection.days} />
      ) : null}

      {isHealthLoading ? (
        <ActivitySectionLoading title="exercise" />
      ) : exerciseSection ? (
        <ActivitySection title={exerciseSection.label} days={exerciseSection.days} />
      ) : null}

      {isWorkLoading ? (
        <ActivitySectionLoading title="coding" />
      ) : codingSection ? (
        <ActivitySection title={codingSection.label} days={codingSection.days} />
      ) : null}

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

      {isGamingLoading ? (
        <ActivitySectionLoading title="gaming" />
      ) : (
        gamingSections.map(section => (
          <ActivitySection
            key={section.label}
            title={section.label}
            days={section.days}
            activityColor="#111827"
          />
        ))
      )}

      {remainingWorkSections.map(section => (
        <ActivitySection
          key={section.label}
          title={section.label}
          days={section.days}
        />
      ))}

      {isReadingLoading ? (
        <ActivitySectionLoading title="reading" />
      ) : (
        readingSections.map(section => (
          <ActivitySection
            key={section.label}
            title={section.label}
            days={section.days}
          />
        ))
      )}
    </section>
  );
}
