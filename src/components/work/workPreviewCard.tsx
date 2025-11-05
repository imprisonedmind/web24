"use client";

import Image from "next/image";

import { type WorkCardData } from "@/lib/workData";

interface WorkPreviewCardProps {
  item: WorkCardData;
}

export function WorkPreviewCard({ item }: WorkPreviewCardProps) {
  return (
    <div
      className="
        flex w-full flex-col gap-4 overflow-clip rounded-xl bg-white p-2
        shadow-sm transition duration-300 ease-in-out hover:shadow-md
      "
    >
      <div className={"relative h-64 w-full overflow-hidden rounded-lg"}>
        <Image
          src={item.src}
          alt={item.alt}
          fill={true}
          priority={true}
          sizes={"50vw"}
          placeholder={"blur"}
          className={"w-full bg-gray-200 object-cover"}
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-neutral-900">{item.title}</p>

        <span className="flex-shrink-0 rounded-full bg-neutral-100 p-1 px-2 text-xs tracking-wide text-neutral-600">
          {item.tag}
        </span>
      </div>
    </div>
  );
}
