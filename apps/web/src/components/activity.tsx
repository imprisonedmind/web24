import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

import type { WatchDay } from "../types";
import { SectionHeader, SmallLink } from "./legacy";

function chunkArray(days: WatchDay[], chunkSize: number) {
  const chunks: WatchDay[][] = [];
  let currentChunk: WatchDay[] = [];

  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const startDate = new Date(days[0].date);
  const startDayOfWeek = startDate.getDay();

  if (startDayOfWeek !== 0) {
    for (let index = 0; index < startDayOfWeek; index += 1) {
      const previousDate = new Date(startDate);
      previousDate.setDate(startDate.getDate() - (startDayOfWeek - index));
      currentChunk.push({
        date: formatDate(previousDate),
        total: 0,
        categories: []
      });
    }
  }

  days.forEach(day => {
    currentChunk.push(day);
    if (currentChunk.length === chunkSize) {
      chunks.push(currentChunk);
      currentChunk = [];
    }
  });

  if (currentChunk.length > 0) {
    const lastDate = new Date(currentChunk[currentChunk.length - 1].date);
    while (currentChunk.length < chunkSize) {
      lastDate.setDate(lastDate.getDate() + 1);
      currentChunk.push({
        date: formatDate(lastDate),
        total: 0,
        categories: []
      });
    }
    chunks.push(currentChunk);
  }

  return chunks;
}

function HeatMapDates() {
  const labels = ["S", "M", "T", "W", "T", "F", "S"] as const;

  return (
    <ul className="grid grid-rows-[7] gap-[3px] p-[2px]">
      {labels.map((title, index) => (
        <li
          key={`${title}-${index}`}
          className="m-auto flex h-[10px] w-[10px] items-center justify-center rounded-sm border-[0.5px] border-gray-200 bg-white text-[7px] font-medium shadow-sm"
        >
          {title}
        </li>
      ))}
    </ul>
  );
}

function formatDateLabel(dateString: string) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  const [year, month, day] = dateString.split("-");
  const formattedMonth = months[parseInt(month, 10) - 1];

  return `${day} ${formattedMonth} ${year.slice(2)}`;
}

function formatDuration(timeInSeconds: number) {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.round((timeInSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function Chunk({ chunk }: { chunk: WatchDay[] }) {
  const categoryColors: Record<string, string> = {
    Coding: "#20b958",
    Designing: "#a855f7",
    Meeting: "#de44ef",
    "Writing Docs": "#08eac1",
    Browsing: "#086aea",
    Movie: "#ea4408",
    Episode: "#ea7908",
    Listening: "#20b958"
  };

  const today = new Date().toISOString().split("T")[0];
  const defaultColor = "#f3f4f6";
  const defaultBorderColor = "#e5e7eb";
  const todayBorderColor = "#0ea5e9";
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setModalRoot(document.getElementById("modal"));
    }
  }, []);

  return (
    <div className="flex flex-col gap-[3px] p-[2px]">
      {chunk.map(chunkItem => {
        const dominantCategory =
          chunkItem.categories && chunkItem.categories.length > 0
            ? chunkItem.categories.reduce((max, current) =>
                current.total > max.total ? current : max
              )
            : undefined;
        const baseColor = dominantCategory
          ? categoryColors[dominantCategory.name] ?? defaultColor
          : defaultColor;
        const opacity = Math.min((chunkItem.total / 2300) / 14, 1);
        const red = parseInt(baseColor.slice(1, 3), 16);
        const green = parseInt(baseColor.slice(3, 5), 16);
        const blue = parseInt(baseColor.slice(5, 7), 16);
        const borderColor =
          !chunkItem.categories || chunkItem.total < 60
            ? defaultBorderColor
            : chunkItem.date === today
              ? todayBorderColor
              : categoryColors[dominantCategory?.name ?? ""] ?? defaultBorderColor;
        const backgroundColor =
          !chunkItem.categories || chunkItem.total < 60
            ? defaultColor
            : `rgba(${red}, ${green}, ${blue}, ${opacity})`;
        const visibleCategories = (chunkItem.categories ?? []).filter(category => category.total > 60);
        const dateTitle =
          chunkItem.date === today ? "Today's Stats!" : formatDateLabel(chunkItem.date);

        return (
          <div
            key={chunkItem.date}
            className="relative"
          >
            {hoveredDate === chunkItem.date && modalRoot && hoverPosition
              ? createPortal(
                  <div
                    className="pointer-events-none absolute z-10 flex h-fit w-max flex-col gap-2 rounded-sm bg-white p-2 shadow-lg"
                    style={{ top: `${hoverPosition.y}px`, left: `${hoverPosition.x + 10}px` }}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold">{dateTitle}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <p>Total:</p>
                        <p>{formatDuration(chunkItem.total)}</p>
                      </div>
                    </div>
                    {chunkItem.categories && chunkItem.categories.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold">Categories</p>
                        <ul>
                          {visibleCategories.map(category => (
                              <li
                                key={category.name}
                                className="flex justify-between gap-4 text-xs text-gray-500"
                              >
                                <p>{category.name}:</p>
                                <p>{formatDuration(category.total)}</p>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No categories</p>
                    )}
                  </div>,
                  modalRoot
                )
              : null}
            <div
              className={`h-[10px] w-[10px] flex-shrink-0 cursor-pointer rounded-sm border-gray-200 ${chunkItem.date === today ? "border-[1px]" : "border-[0.3px]"}`}
              style={{
                backgroundColor,
                borderColor
              }}
              onMouseEnter={event => {
                setHoveredDate(chunkItem.date);
                setHoverPosition({ x: event.pageX, y: event.pageY });
              }}
              onMouseMove={event => {
                setHoverPosition({ x: event.pageX, y: event.pageY });
              }}
              onMouseLeave={() => {
                setHoveredDate(null);
                setHoverPosition(null);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function ActivitySection({
  title,
  days,
  header,
  emptyMessage
}: {
  title: string;
  days: WatchDay[];
  header?: ReactNode;
  emptyMessage?: string;
}) {
  if (!days.length) {
    return emptyMessage ? (
      <section className="flex flex-col gap-1">
        {header ?? <SectionHeader title={title} />}
        <div className="flex min-h-[108px] items-center rounded-lg bg-white p-4 text-sm text-neutral-500 shadow-sm">
          {emptyMessage}
        </div>
      </section>
    ) : null;
  }

  return (
    <section className="flex flex-col gap-1">
      {header ?? <SectionHeader title={title} />}
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

export function TelevisionActivityHeader() {
  return (
    <div className="relative">
      <span className="flex flex-row items-center justify-between">
        <SectionHeader title="watching" />
      </span>
    </div>
  );
}

export function ActivityRouteHeader() {
  return <SectionHeader title="activity" action={<SmallLink href="/" label="home" />} />;
}
