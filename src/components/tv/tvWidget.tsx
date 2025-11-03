// app/(widgets)/TvWidget.tsx
import Image from "next/image";
import { formatDistanceToNowStrict } from "date-fns";

import { getLastWatched } from "@/app/activity/actions/getLastWatched";
import { Header } from "@/components/header";

export function formatLastWatchedTitle(
  data: Awaited<ReturnType<typeof getLastWatched>>
) {
  if (!data) return "Nothing watched yet";
  if (data.type === "episode") {
    const parts = [];
    if (typeof data.season === "number") parts.push(`s${data.season}`);
    if (typeof data.episode === "number") parts.push(`e${data.episode}`);
    const name = data.episodeTitle ?? data.title;
    if (name) parts.push(name);
    if (parts.length) return parts.join("/");
  }
  return data.title;
}

export default async function TvWidget() {
  const data = await getLastWatched();
  const displayTitle = formatLastWatchedTitle(data);

  return (
    <div className="flex w-full flex-col gap-1">
      <Header title="watched" seeAll link="/watched" />

      <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm">
        <div className="relative h-72 w-full overflow-hidden rounded-lg">
          {data ? (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
            >
              <Image
                src={data.posterUrl}
                alt={data.title}
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
            </a>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500">
              Nothing watched yet
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          {data ? (
            <>
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-800 max-w-[150px] truncate hover:underline"
              >
                {displayTitle}
              </a>

              <div className="flex-shrink-0 rounded-full bg-neutral-100 p-1 px-2 text-xs">
                {formatDistanceToNowStrict(new Date(data.watchedAt))}{" "}
                ago
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-800">Nothing watched yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
