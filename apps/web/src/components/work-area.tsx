import type { WorkItem } from "@web24/content";

import { SectionHeader } from "./legacy";
import { WorkCarousel } from "./work-carousel";

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
      <WorkCarousel items={data} />
    </div>
  );
}
