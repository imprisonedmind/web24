import type { WorkItem } from "@web24/content";

import { SectionHeader } from "./legacy";
import { WorkListCard } from "./work-card";

export function WorkArea({
  header,
  data,
}: {
  header: string;
  data: WorkItem[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title={header} />
      {data.length ? (
        <div className="flex flex-col gap-3">
          {data.map((item, index) => (
            <WorkListCard key={`${item.link}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
          Nothing to show here just yet.
        </p>
      )}
    </div>
  );
}
