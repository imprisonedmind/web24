"use client";
import React, { FC, Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChunkHover } from "@/components/coding/chunkHover";

interface ChunkProps {
  chunk: any[];
}

export const Chunk: FC<ChunkProps> = ({ chunk }) => {
  const [modal, setModal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const modal = document.getElementById("modal");
      setModal(modal);
    }
  }, []);

  const maxHours = 10;
  const minColor = [240, 255, 237]; // Very light green
  const maxColor = [27, 150, 0]; // Dark green

  const [xPos, setXpos] = useState<number>(0);
  const [yPos, setYpos] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, index: number) => {
    setXpos(e.pageX);
    setYpos(e.pageY);
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Fragment>
      <div className="flex flex-col gap-[3px] p-[2px]">
        {chunk.map((chunkItem, index) => {
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
            <div key={index} className={"relative"}>
              {activeIndex === index &&
                modal &&
                createPortal(
                  <ChunkHover
                    chunkItem={chunkItem}
                    time={chunkItem.total / 3600}
                    yPos={yPos}
                    xPos={xPos}
                  />,
                  modal,
                )}
              <div className="group relative cursor-pointer">
                <div
                  onMouseEnter={(e) => handleMouseEnter(e, index)}
                  onMouseLeave={() => handleMouseLeave()}
                  className={`
                  ${colorClasses && "border-green-500"}
                  h-[10px] w-[10px] flex-shrink-0 rounded-sm border-[0.5px] 
                  border-gray-200 bg-gray-100
                `}
                  style={{ backgroundColor: colorClasses || "" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Fragment>
  );
};
