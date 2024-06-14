import { Header } from "@/components/header";
import { Chunk } from "@/components/coding/chunk";
import HeatMapDates from "@/components/coding/heatMapDates";
import { chunkArray } from "@/lib/util";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { Modal } from "react-notion-x/build/third-party/modal";
import { createPortal } from "react-dom";
import { ChunkHover } from "@/components/coding/chunkHover";
import React from "react";
import CodingHeader from "@/components/coding/codingHeader";

const getCodingData = async () => {
  const data = await fetch(
    "https://wakatime.com/share/@018c620c-4d0b-4835-a919-aefff3d87af2/c68e7bc4-65b4-4421-914f-3e1e404c199d.json",
    {
      method: "GET",
      headers: {
        dataType: "jsonp",
      },
    },
  );
  return await data.json();
};

export default async function Coding() {
  const data = await getCodingData();

  return (
    <section className="flex flex-col gap-1 px-4 sm:p-0">
      <CodingHeader />
      <div className="flex flex-row rounded-lg bg-white p-2 pl-1 shadow-sm">
        <HeatMapDates />
        <div
          className="
            flex w-full flex-nowrap justify-end overflow-x-clip pr-[16px]
            sm:pr-[14px]
          "
        >
          {chunkArray(data.days, 7).map((chunk, index) => {
            return <Chunk key={index} chunk={chunk} />;
          })}
        </div>
      </div>
    </section>
  );
}
