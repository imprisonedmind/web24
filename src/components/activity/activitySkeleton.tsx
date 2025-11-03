import React from "react";

type ActivitySkeletonProps = {
  title: string;
};

export function ActivitySkeleton({ title }: ActivitySkeletonProps) {
  return (
    <section className="flex flex-col gap-1 px-4 sm:p-0">
      <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 text-[0px]">
        {title}
      </div>
      <div className="flex flex-row rounded-lg bg-neutral-100 p-2 pl-1 shadow-sm">
        <div className="mr-2 h-16 w-5 animate-pulse rounded bg-neutral-200" />
        <div className="h-16 w-full animate-pulse rounded bg-neutral-200" />
      </div>
    </section>
  );
}

