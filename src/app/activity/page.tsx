// app/activity/page.tsx
import { Suspense } from "react";

import { getWatchDaysLastYear } from "@/app/activity/actions/getWatchHistoryForYear";
import { ActivitySection } from "@/components/activity/activitySection";
import TelevisionHeader from "@/components/activity/televisionHeader";
import { getCodingData } from "@/components/coding/coding";
import Breadcrumbs from "@/components/breadcrumbs";
import { ActivitySkeleton } from "@/components/activity/activitySkeleton";
import { PageContainer } from "@/components/ui/page-container";
import { createMetadata, createSeoProps, type CreateMetadataOptions } from "@/lib/seo";
import { Seo } from "@/components/seo/seo";

const ACTIVITY_SEO: CreateMetadataOptions = {
  title: "Activity | Luke Stephens",
  description:
    "Yearly breakdowns of Luke Stephens' television watching and work activity, including coding, writing, and design.",
  path: "/activity"
};

export const metadata = createMetadata(ACTIVITY_SEO);
const activitySeo = createSeoProps(ACTIVITY_SEO);

const CATEGORY_LABELS: Record<string, string> = {
  Coding: "coding",
  "Writing Docs": "writing",
  Designing: "designing",
  Meeting: "meeting",
  Browsing: "browsing",
};

type ActivityDay = {
  date: string;
  total: number;
  categories?: { name: string; total: number }[];
};

function mapDaysToCategory(days: ActivityDay[], category: string) {
  return days.map((day) => {
    const match = day.categories?.find((cat) => cat.name === category);
    const total = match?.total ?? 0;
    return {
      date: day.date,
      total,
      categories: match ? [{ name: match.name, total }] : [],
    };
  });
}

function sumTotals(days: { total: number }[]) {
  return days.reduce((acc, curr) => acc + (curr.total ?? 0), 0);
}

async function TelevisionActivity() {
  const televisionDays = await getWatchDaysLastYear();
  return (
    <ActivitySection
      title="watching"
      days={televisionDays}
      header={<TelevisionHeader />}
    />
  );
}

async function WorkActivity() {
  const codingData = await getCodingData();
  const wakaDays: ActivityDay[] = codingData?.days ?? [];

  const sections = Object.entries(CATEGORY_LABELS)
    .map(([sourceName, label]) => {
      const days = mapDaysToCategory(wakaDays, sourceName);
      return { label, days, total: sumTotals(days) };
    })
    .filter((section) => section.total > 0);

  if (!sections.length) return null;

  return (
    <>
      {sections.map((section) => (
        <ActivitySection
          key={section.label}
          title={section.label}
          days={section.days}
        />
      ))}
    </>
  );
}

const WORK_SKELETON_TITLES = [
  "coding",
  "writing",
  "designing",
  "meeting",
  "browsing",
];

export default function Activity() {
  return (
    <PageContainer className="mb-8 flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4 sm:px-0">
      <Seo {...activitySeo} />
      <Breadcrumbs />

      <Suspense fallback={<ActivitySkeleton title="watching" />}>
        <TelevisionActivity />
      </Suspense>

      <Suspense
        fallback={
          <>
            {WORK_SKELETON_TITLES.map((title) => (
              <ActivitySkeleton key={title} title={title} />
            ))}
          </>
        }
      >
        <WorkActivity />
      </Suspense>
    </PageContainer>
  );
}
