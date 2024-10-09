"use client";
import { FC } from "react";
import { formatDate } from "@/lib/util";

interface Category {
  name: string;
  total: number;
}

interface ChunkHoverProps {
  chunkItem: {
    date: string;
    total: number;
    categories?: Category[];
  };
  time: number;
  yPos: number;
  xPos: number;
  date: string;
}

export const ChunkHover: FC<ChunkHoverProps> = ({
  chunkItem,
  time,
  yPos,
  xPos,
  date,
}) => {
  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.round((timeInSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const dateTitle =
    date === chunkItem.date ? "Today's Stats!" : formatDate(chunkItem.date);

  return (
    <div
      className="
        pointer-events-none absolute z-10 flex h-fit w-max flex-col gap-2
        rounded-sm bg-white p-2 shadow-lg
      "
      style={{ top: `${yPos}px`, left: `${xPos + 10}px` }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold">{dateTitle}</p>
        <div className="flex justify-between text-xs text-gray-500">
          <p>Total:</p>
          <p>{formatTime(chunkItem.total)}</p>
        </div>
      </div>
      {chunkItem.categories && chunkItem.categories.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold">Categories</p>
          <ul>
            {chunkItem.categories.map((category, index) => {
              if (category.total > 60) {
                return (
                  <li
                    key={index}
                    className="flex justify-between gap-4 text-xs text-gray-500"
                  >
                    <p>{category.name}:</p>
                    <p>{formatTime(category.total)}</p>
                  </li>
                );
              }
            })}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-gray-500">No categories</p>
      )}
    </div>
  );
};
