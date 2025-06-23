"use client";
import React, { FC, Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChunkHover } from "@/components/coding/chunkHover";
import { formatDate } from "@/lib/util";

interface ChunkProps {
  chunk: any[];
}

interface CategoryColors {
  [key: string]: string;
}

export const Chunk: FC<ChunkProps> = ({ chunk }) => {
  const [modal, setModal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const modal = document.getElementById("modal");
      setModal(modal);
    }
  }, []);

  const maxHours = 14; // Maximum hours for full opacity
  const categoryColors: CategoryColors = {
    Coding: "#20b958", // Green
    Designing: "#a855f7", // Purple
    Meeting: "#de44ef", // Red
    "Writing Docs": "#08eac1", // Yellow
    "Browsing": "#086aea", // Blue
    "Movie": "#ea4408", // Blue
    "Episode": "#ea7908", // Blue
  };
  const defaultColor = "#f3f4f6"; // Light gray for items without categories
  const defaultBorderColor = "#e5e7eb";
  const todayBorderColor = "#0ea5e9";

  let timestamp = Date.now();
  let dateObject = new Date(timestamp);
  let formattedDate = dateObject.toISOString().split("T")[0];

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

  const getCategoryColorWithOpacity = (chunkItem: any): string => {
    if (!chunkItem.categories || chunkItem.total < 60) {
      return defaultColor;
    }

    const maxCategory = chunkItem.categories.reduce((max: any, cat: any) =>
      cat.total > max.total ? cat : max,
    );
    const baseColor = categoryColors[maxCategory.name] || defaultColor;

    // Calculate opacity based on total time
    const totalHours = chunkItem.total / 2300;
    const opacity = Math.min(totalHours / maxHours, 1);

    // Convert hex to RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getCategoryColor = (chunkItem: any): string => {
    if (!chunkItem.categories || chunkItem.total < 60) {
      return defaultBorderColor;
    }

    const maxCategory = chunkItem.categories.reduce((max: any, cat: any) =>
      cat.total > max.total ? cat : max,
    );
    const baseColor =
      formattedDate === chunkItem.date
        ? todayBorderColor
        : categoryColors[maxCategory.name] || defaultBorderColor;

    // Convert hex to RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, 1)`;
  };

  return (
    <Fragment>
      <div className="flex flex-col gap-[3px] p-[2px]">
        {chunk.map((chunkItem, index) => {
          const color = getCategoryColorWithOpacity(chunkItem);
          const border = getCategoryColor(chunkItem);
          const isToday = formattedDate === chunkItem.date;

          return (
            <div key={index} className="relative">
              {activeIndex === index &&
                modal &&
                createPortal(
                  <ChunkHover
                    chunkItem={chunkItem}
                    time={chunkItem.total / 3600}
                    yPos={yPos}
                    xPos={xPos}
                    date={formattedDate}
                  />,
                  modal,
                )}
              <div className="group relative cursor-pointer">
                <div
                  onMouseEnter={(e) => handleMouseEnter(e, index)}
                  onMouseLeave={handleMouseLeave}
                  className={`
                    h-[10px] w-[10px] flex-shrink-0 rounded-sm 
                    border-gray-200 ${isToday ? "border-[1px]" : "border-[0.3px]"}
                  `}
                  style={{
                    backgroundColor: color,
                    borderColor: border,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Fragment>
  );
};
