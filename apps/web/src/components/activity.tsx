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
  return (
    <ul className="grid grid-rows-[7] gap-[3px] p-[2px]">
      {["S", "M", "T", "W", "T", "F", "S"].map(title => (
        <li
          key={title}
          className="m-auto flex h-[10px] w-[10px] items-center justify-center rounded-sm border-[0.5px] border-gray-200 bg-white text-[7px] font-medium shadow-sm"
        >
          {title}
        </li>
      ))}
    </ul>
  );
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

  return (
    <div className="flex flex-col gap-[3px] p-[2px]">
      {chunk.map(chunkItem => {
        const dominantCategory = chunkItem.categories?.reduce((max, current) =>
          current.total > max.total ? current : max
        );
        const baseColor = dominantCategory ? categoryColors[dominantCategory.name] ?? defaultColor : defaultColor;
        const opacity = Math.min((chunkItem.total / 2300) / 14, 1);
        const red = parseInt(baseColor.slice(1, 3), 16);
        const green = parseInt(baseColor.slice(3, 5), 16);
        const blue = parseInt(baseColor.slice(5, 7), 16);
        const borderColor =
          chunkItem.date === today
            ? todayBorderColor
            : dominantCategory
              ? categoryColors[dominantCategory.name] ?? defaultBorderColor
              : defaultBorderColor;

        return (
          <div
            key={chunkItem.date}
            className={`h-[10px] w-[10px] flex-shrink-0 rounded-sm ${chunkItem.date === today ? "border-[1px]" : "border-[0.3px]"}`}
            style={{
              backgroundColor:
                chunkItem.total < 60
                  ? defaultColor
                  : `rgba(${red}, ${green}, ${blue}, ${opacity})`,
              borderColor
            }}
            title={`${chunkItem.date} • ${Math.round(chunkItem.total / 60)} min`}
          />
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
      <section className="flex flex-col gap-1 px-4 sm:p-0">
        {header ?? <SectionHeader title={title} />}
        <div className="rounded-lg bg-white p-4 text-sm text-neutral-500 shadow-sm">
          {emptyMessage}
        </div>
      </section>
    ) : null;
  }

  return (
    <section className="flex flex-col gap-1 px-4 sm:p-0">
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

function mergeDays(wakaDays: WatchDay[], traktDays: WatchDay[]) {
  const map: Record<string, WatchDay> = {};

  for (const day of wakaDays) {
    map[day.date] = {
      date: day.date,
      total: day.total,
      categories: Array.isArray(day.categories) ? [...day.categories] : []
    };
  }

  for (const day of traktDays) {
    if (!map[day.date]) {
      map[day.date] = {
        date: day.date,
        total: day.total,
        categories: Array.isArray(day.categories) ? [...day.categories] : []
      };
      continue;
    }

    map[day.date].total += day.total;
    for (const category of day.categories ?? []) {
      const existing = map[day.date].categories?.find(item => item.name === category.name);
      if (existing) {
        existing.total += category.total;
      } else {
        map[day.date].categories = [...(map[day.date].categories ?? []), category];
      }
    }
  }

  const sortedKeys = Object.keys(map).sort();
  if (!sortedKeys.length) return [];

  const start = new Date(`${sortedKeys[0]}T00:00:00Z`);
  const end = new Date();
  const current = new Date(start);

  while (current <= end) {
    const iso = current.toISOString().slice(0, 10);
    if (!map[iso]) {
      map[iso] = { date: iso, total: 0, categories: [] };
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export function HomeActivityPreview() {
  const [days, setDays] = useState<WatchDay[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [wakaResponse, watchResponse] = await Promise.all([
          fetch(
            "https://wakatime.com/share/@018c620c-4d0b-4835-a919-aefff3d87af2/c68e7bc4-65b4-4421-914f-3e1e404c199d.json",
            {
              method: "GET",
              headers: {
                dataType: "jsonp"
              }
            }
          ),
          fetch("/api/watched/days-last-year", { credentials: "include" })
        ]);

        const todayIso = new Date().toISOString().split("T")[0];
        const wakaPayload = wakaResponse.ok ? await wakaResponse.json() : null;
        const wakaDays = Array.isArray(wakaPayload?.days)
          ? (wakaPayload.days as WatchDay[]).filter(day => day?.date && day.date <= todayIso)
          : [];

        const watchPayload = watchResponse.ok
          ? ((await watchResponse.json()) as { days?: WatchDay[] })
          : { days: [] };

        if (!cancelled) {
          setDays(mergeDays(wakaDays, watchPayload.days ?? []));
        }
      } catch (error) {
        console.error("[web/home-activity] failed", error);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ActivitySection
      title="activity"
      days={days}
      header={<SectionHeader title="activity" action={<SmallLink href="/activity" label="more" />} />}
      emptyMessage="No activity available."
    />
  );
}
