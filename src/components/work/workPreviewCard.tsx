"use client";

import Image from "next/image";

import { type WorkCardData } from "@/lib/workData";

interface WorkPreviewCardProps {
  item: WorkCardData;
}

export function WorkPreviewCard({ item }: WorkPreviewCardProps) {
  const blurDataURL = item.src.blurDataURL ?? undefined;
  const placeholder = blurDataURL ? "blur" : "empty";

  return (
    <div className="pointer-events-none flex w-full flex-col gap-3 overflow-hidden rounded-xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
      <div className="relative h-56 w-full overflow-hidden rounded-lg bg-neutral-100">
        <Image
          src={item.src}
          alt={item.alt}
          fill
          priority
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes="(min-width: 768px) 320px, 90vw"
          className="object-cover"
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-neutral-900">{item.title}</p>
        <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2 text-xs tracking-wide text-neutral-600">
          {item.tag}
        </span>
      </div>
    </div>
  );
}
