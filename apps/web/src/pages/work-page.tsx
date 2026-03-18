import { collegeWorkItems, personalWorkItems, professionalWorkItems } from "@web24/content";

import { Breadcrumbs } from "../components/breadcrumbs";
import { WorkArea } from "../components/work-area";

export function WorkPage() {
  return (
    <section className="flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4">
      <Breadcrumbs />
      <WorkArea header="professional" data={professionalWorkItems} />
      <WorkArea header="personal" data={personalWorkItems} />
      <WorkArea header="college" data={collegeWorkItems} />
    </section>
  );
}
