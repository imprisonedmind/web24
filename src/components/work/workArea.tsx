import React, { FC } from "react";
import { Header } from "@/components/header";
import { WorkCardData } from "@/lib/workData";
import { WorkCarousel } from "@/components/work/workCarousel";

interface WorkAreaProps {
  header: string;
  data: WorkCardData[];
}

export const WorkArea: FC<WorkAreaProps> = ({ header, data }) => {
  return (
    <div className={"flex flex-col gap-3"}>
      <Header title={header} />
      <WorkCarousel items={data} />
    </div>
  );
};
