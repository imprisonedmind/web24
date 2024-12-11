import React, { FC, Fragment } from "react";
import { Header } from "@/components/header";
import { WorkCardData, workData } from "@/lib/workData";
import { WorkCard } from "@/components/workCard";

interface WorkAreaProps {
  header: string;
  data: WorkCardData[];
}

export const WorkArea: FC<WorkAreaProps> = ({ header, data }) => {
  return (
    <div className={"flex flex-col gap-1"}>
      <Header title={header} />
      <div className={"grid w-full grid-cols-1 gap-4 md:grid-cols-3"}>
        {data.map((item: WorkCardData, index: number) => {
          return (
            <WorkCard
              key={index}
              title={item.title}
              link={item.link}
              tag={item.tag}
              src={item.src}
              alt={item.alt}
              internal={item.internal}
            />
          );
        })}
      </div>
    </div>
  );
};
