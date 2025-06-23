// app/(widgets)/TvWidget.tsx
import { Header } from '@/components/header';
import Image from 'next/image';
import { formatDistanceToNowStrict } from 'date-fns';
import { getLastWatched } from '@/app/activity/actions/getLastWatched';

export default async function TvWidget() {
  const data = await getLastWatched();

  return (
    <div className="flex w-full flex-col gap-1">
      <Header title="last watched" />

      <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm">
        {/* Clickable poster */}
        <div className="relative h-72 w-full overflow-hidden rounded-lg">
          {data && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"   // keeps Image clickable
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
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          {data ? (
            <>
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-800 max-w-[150px] truncate hover:underline"
              >
                {data.title}
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