import { Component, type ErrorInfo, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { homeActivityQueryOptions } from "../lib/api";
import { ActivitySection, ActivitySectionLoading } from "./activity";
import { SectionHeader, SmallLink } from "./legacy";

export function HomeActivityWidgetLoading() {
  return (
    <ActivitySectionLoading
      title="activity"
      header={
        <SectionHeader
          title="activity"
          action={<SmallLink href="/activity" label="more" ariaLabel="More activity" srSuffix=" activity" />}
        />
      }
    />
  );
}

export function HomeActivityWidgetUnavailable() {
  return (
    <ActivitySection
      title="activity"
      days={[]}
      header={
        <SectionHeader
          title="activity"
          action={<SmallLink href="/activity" label="more" ariaLabel="More activity" srSuffix=" activity" />}
        />
      }
      emptyMessage="Activity unavailable right now."
    />
  );
}

export class HomeActivityWidgetErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error("[home-activity-widget] failed", error);
  }

  render() {
    if (this.state.hasError) {
      return <HomeActivityWidgetUnavailable />;
    }

    return this.props.children;
  }
}

export function HomeActivityWidget() {
  const { data } = useSuspenseQuery(homeActivityQueryOptions);

  if (data === null) {
    return <HomeActivityWidgetUnavailable />;
  }

  return (
    <ActivitySection
      title="activity"
      days={data}
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
