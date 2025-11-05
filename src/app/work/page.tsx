import { workData } from "@/lib/workData";
import Breadcrumbs from "@/components/breadcrumbs";
import React from "react";
import { WorkArea } from "@/components/work/workArea";
import { PageContainer } from "@/components/ui/page-container";

export default function Page() {
  const specificData = (value: string) => {
    return workData().filter((item) => item.type === value);
  };

  return (
    <PageContainer className="flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4">
      <Breadcrumbs />

      <WorkArea header={"professional"} data={specificData("professional")} />
      <WorkArea header={"personal"} data={specificData("personal")} />
      <WorkArea header={"college"} data={specificData("college")} />
    </PageContainer>
  );
}
