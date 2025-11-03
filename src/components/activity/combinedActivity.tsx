import { Chunk } from "@/components/coding/chunk";
import HeatMapDates from "@/components/coding/heatMapDates";
import { chunkArray } from "@/lib/util";
import React from "react";
import { getWatchDaysLastYear } from "@/app/activity/actions/getWatchHistoryForYear";
import { mergeDays } from "@/lib/mergeDays";
import ActivityHeader from "@/components/activity/activityHeader";

export const getCodingData = async () => {
  const data = await fetch(
    "https://wakatime.com/share/@018c620c-4d0b-4835-a919-aefff3d87af2/c68e7bc4-65b4-4421-914f-3e1e404c199d.json",
    {
      method: "GET",
      headers: {
        dataType: "jsonp"
      }
    }
  );

  const json = await data.json();
  return json.days;
};

export default async function CombinedActivity() {
  const [codeDays, watchDays] = await Promise.all([
    getCodingData(),
    getWatchDaysLastYear(),
  ]);

  const days = mergeDays(codeDays ?? [], watchDays ?? []);

  if (!days.length) return null;

  return (
    <section className="flex flex-col gap-1 px-4 sm:p-0">
      <ActivityHeader />
      <div className="flex flex-row rounded-lg bg-white p-2 pl-1 shadow-sm">
        <HeatMapDates />
        <div
          className="flex w-full flex-nowrap justify-end overflow-x-clip pr-[16px] sm:pr-[14px]"
        >
          {chunkArray(days, 7).map((chunk, index) => {
            return <Chunk key={index} chunk={chunk} />;
          })}
        </div>
      </div>
    </section>
  );
}
