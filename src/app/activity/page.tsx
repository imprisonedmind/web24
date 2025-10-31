// app/activity/page.tsx
import {
  getWatchDaysLastYear
} from "@/app/activity/actions/getWatchHistoryForYear";
import { ActivitySection } from "@/components/activity/activitySection";
import TelevisionHeader from "@/components/activity/televisionHeader";
import { getCodingData } from "@/components/coding/coding";
import React from "react";
import Breadcrumbs from "@/components/breadcrumbs";

type ActivityDay = {
  date: string;
  total: number;
  categories?: { name: string; total: number }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  Coding: "coding",
  "Writing Docs": "writing",
  Designing: "designing",
  Meeting: "meeting",
  Browsing: "browsing"
};

function mapDaysToCategory(days: ActivityDay[], category: string) {
  return days.map(day => {
    const match = day.categories?.find(cat => cat.name === category);
    const total = match?.total ?? 0;
    return {
      date: day.date,
      total,
      categories: match ? [{ name: match.name, total }] : []
    };
  });
}

function sumTotals(days: { total: number }[]) {
  return days.reduce((acc, curr) => acc + (curr.total ?? 0), 0);
}

export default async function Activity() {
  const [televisionDays, codingData] = await Promise.all([
    getWatchDaysLastYear(),
    getCodingData()
  ]);

  const wakaDays: ActivityDay[] = codingData?.days ?? [];

  const categorySections = Object.entries(CATEGORY_LABELS)
    .map(([sourceName, label]) => {
      const days = mapDaysToCategory(wakaDays, sourceName);
      return { label, days, total: sumTotals(days) };
    })
    .filter(section => section.total > 0);

  return (
    <div className="mx-auto mb-8 flex max-w-[600px] flex-col gap-8 py-4 px-[calc(min(16px,8vw))] sm:px-0">
      <Breadcrumbs />

      <ActivitySection
        title="television"
        days={televisionDays}
        header={<TelevisionHeader />}
      />

      {categorySections.map(section => (
        <ActivitySection
          key={section.label}
          title={section.label}
          days={section.days}
        />
      ))}
    </div>
  );
}
