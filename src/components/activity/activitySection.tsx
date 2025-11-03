import { Chunk } from "@/components/coding/chunk";
import HeatMapDates from "@/components/coding/heatMapDates";
import CodingHeader from "@/components/coding/codingHeader";
import { chunkArray } from "@/lib/util";
import React from "react";

type ActivityDay = {
  date: string;
  total: number;
  categories?: { name: string; total: number }[];
};

interface ActivitySectionProps {
  title: string;
  days: ActivityDay[];
  header?: React.ReactNode;
  emptyMessage?: string;
}

export function ActivitySection({ title, days, header, emptyMessage }: ActivitySectionProps) {
  if (!days?.length) {
    return emptyMessage
      ? (
        <section className="flex flex-col gap-1 px-4 sm:p-0">
          {header ?? <CodingHeader title={title} />}
          <div className="rounded-lg bg-white p-4 text-sm text-neutral-500 shadow-sm">
            {emptyMessage}
          </div>
        </section>
      )
      : null;
  }

  return (
    <section className="flex flex-col gap-1 px-4 sm:p-0">
      {header ?? <CodingHeader title={title} />}
      <div className="flex flex-row rounded-lg bg-white p-2 pl-1 shadow-sm">
        <HeatMapDates />
        <div className="flex w-full flex-nowrap justify-end overflow-x-clip pr-[16px] sm:pr-[14px]">
          {chunkArray(days, 7).map((chunk, index) => (
            <Chunk key={index} chunk={chunk} />
          ))}
        </div>
      </div>
    </section>
  );
}
