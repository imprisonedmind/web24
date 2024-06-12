"use client";
import { FC } from "react";
import { formatDate } from "@/lib/util";

interface ChunkHoverProps {
  chunkItem: any;
  time: any;
  yPos: number;
  xPos: number;
}

export const ChunkHover: FC<ChunkHoverProps> = ({
  chunkItem,
  time,
  yPos,
  xPos,
}) => {
  return (
    <div
      className="
        absolute z-10 flex h-fit w-max flex-col gap-1 rounded-sm bg-white p-2
        shadow-lg
      "
      style={{ top: `${yPos - 60}px`, left: `${xPos - 60}px` }}
    >
      <p className="text-xs">{formatDate(chunkItem.date)}</p>
      <p className="text-xs text-gray-500">
        {time > 0
          ? time >= 1
            ? `${Math.floor(time)} Hours`
            : `${Math.round(chunkItem.total / 60)} Minutes`
          : "no time"}
      </p>
    </div>
  );
};
