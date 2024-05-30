import { FC } from "react";
import is from "@sindresorhus/is";
import date = is.date;
import { formatDate } from "@/lib/util";

interface ChunkProps {
  chunk: any[];
}

export const Chunk: FC<ChunkProps> = ({ chunk }) => {
  return (
    <div className={"flex flex-col gap-[3px] p-[2px]"}>
      {chunk.map((chunkItem, index) => {
        const maxHours = 10;
        const minColor = [240, 255, 237]; // Very light green
        const maxColor = [27, 150, 0]; // Dark green

        const time = Math.min(chunkItem.total / 3600, maxHours);
        const percentage = time / maxHours;

        const r =
          maxColor[0] +
          Math.round((minColor[0] - maxColor[0]) * (1 - percentage));
        const g =
          maxColor[1] +
          Math.round((minColor[1] - maxColor[1]) * (1 - percentage));
        const b =
          maxColor[2] +
          Math.round((minColor[2] - maxColor[2]) * (1 - percentage));

        const colorClasses = !!time && `rgba(${r}, ${g}, ${b}, 1)`;

        return (
          <div key={index} className={"group relative cursor-pointer"}>
            <div
              className="
                absolute -top-16 z-10 hidden w-max flex-col gap-1
                rounded-sm bg-white p-1 shadow-lg group-hover:flex
              "
            >
              <p className={" text-xs"}>{formatDate(chunkItem.date)}</p>
              <p className={"text-xs text-gray-500"}>
                {time > 0
                  ? time >= 1
                    ? `${Math.floor(time)} Hours`
                    : `${Math.round(chunkItem.total / 60)} Minutes`
                  : "no time"}
              </p>
            </div>
            <div
              className={`
              ${colorClasses && "border-green-500"}
              h-[10px] w-[10px] flex-shrink-0 rounded-sm border-[0.5px] 
              border-gray-200 bg-gray-100
            `}
              style={{ backgroundColor: colorClasses || "" }}
            />
          </div>
        );
      })}
    </div>
  );
};
