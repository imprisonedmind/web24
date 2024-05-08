import { Header } from "@/components/header";
import { WorkCard } from "@/components/workCard";
import { WorkCardData, workData } from "@/lib/workData";

export default function Work() {
  return (
    <div className={"flex flex-col gap-1"}>
      <div className={"px-4 md:px-0"}>
        <Header title={"work"} seeAll={true} link={"work"} />
      </div>
      <div
        className={
          "flex grid-cols-3 flex-row gap-2 px-4 pb-4 md:grid md:gap-4 md:px-0 md:pb-0" +
          " overflow-x-auto md:overflow-visible"
        }
      >
        {workData()
          .slice(0, 3)
          .map((item: WorkCardData, index: number) => {
            return (
              <WorkCard
                key={index}
                title={item.title}
                link={item.link}
                tag={item.tag}
                src={item.src}
                alt={item.alt}
              />
            );
          })}
      </div>
    </div>
  );
}
