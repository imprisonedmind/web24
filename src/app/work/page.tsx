import { workData } from "@/lib/workData";
import Breadcrumbs from "@/components/breadcrumbs";
import React from "react";
import { WorkArea } from "@/components/work/workArea";
import { PageContainer } from "@/components/ui/page-container";
import { createMetadata, createSeoProps, type CreateMetadataOptions } from "@/lib/seo";
import { Seo } from "@/components/seo/seo";

const WORK_SEO: CreateMetadataOptions = {
  title: "Work | Luke Stephens",
  description:
    "A catalog of professional, personal, and college projects by Luke Stephens, detailing experience and contributions.",
  path: "/work"
};

export const metadata = createMetadata(WORK_SEO);
const workSeo = createSeoProps(WORK_SEO);

export default function Page() {
  const specificData = (value: string) => {
    return workData().filter((item) => item.type === value);
  };

  return (
    <PageContainer className="flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4">
      <Seo {...workSeo} />
      <Breadcrumbs />

      <WorkArea header={"professional"} data={specificData("professional")} />
      <WorkArea header={"personal"} data={specificData("personal")} />
      <WorkArea header={"college"} data={specificData("college")} />
    </PageContainer>
  );
}
