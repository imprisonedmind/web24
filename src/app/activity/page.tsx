// app/activity/page.tsx
import { chunkArray } from "@/lib/util";
import { Chunk } from "@/components/coding/chunk";
import HeatMapDates from "@/components/coding/heatMapDates";
import { Header } from "@/components/header";
import React from "react";
import Coding, { getCodingData } from "@/components/coding/coding";
import {
  getWatchDaysLastYear
} from "@/app/activity/actions/getWatchHistoryForYear";

export default async function Activity() {
  const data = await getWatchDaysLastYear();
  const cData = await getCodingData();

  return (
    <div className={"mx-auto mb-8 flex max-w-[600px] flex-col gap-8 py-4"}>

      <section className="flex flex-col gap-1 px-4 sm:p-0">
        <Header title={"television"} seeAll={true} link={"/tv"} />
        <div className="flex flex-row rounded-lg bg-white p-2 pl-1 shadow-sm">
          <HeatMapDates />
          <div
            className="flex w-full flex-nowrap justify-end overflow-x-clip pr-[16px] sm:pr-[14px]">
            {chunkArray(data, 7).map((chunk, i) => (
              <Chunk key={i} chunk={chunk} />
            ))}
          </div>
        </div>
      </section>


      <Coding/>
    </div>
  );
}