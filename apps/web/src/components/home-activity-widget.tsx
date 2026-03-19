import { useQuery } from "@tanstack/react-query";

import { homeActivityQueryOptions } from "../lib/api";
import { ActivitySection } from "./activity";
import { SectionHeader, SmallLink } from "./legacy";

export function HomeActivityWidget() {
  const { data: days = [] } = useQuery(homeActivityQueryOptions);

  return (
    <ActivitySection
      title="activity"
      days={days}
      header={
        <SectionHeader
          title="activity"
          action={<SmallLink href="/activity" label="more" ariaLabel="More activity" srSuffix=" activity" />}
        />
      }
      emptyMessage="No activity available."
    />
  );
}
