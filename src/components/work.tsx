import { Header } from "@/components/header";
import { WorkCard } from "@/components/workCard";
import { WorkCardData, workData } from "@/lib/workData";
import { WorkPreviewLink } from "@/components/work/workPreviewLink";

export default function Work() {
  const items = workData();
  const favourites = items.filter((item) => item.favourite);
  const displayItems = (favourites.length ? favourites : items).slice(0, 6);
  const mobileItems = workData().slice(0, 3);

  return (
    <div className="-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0">
      <Header title="work" seeAll link="work" />
      <div className="hidden flex-col gap-1 md:flex">
        {displayItems.map((item) => (
          <WorkPreviewLink key={item.link} item={item} />
        ))}
      </div>

      <div className="md:hidden">
        <div className="flex flex-row gap-2 overflow-x-auto pb-4">
          {mobileItems.map((item: WorkCardData, index: number) => (
            <WorkCard
              key={`${item.title}-${index}`}
              title={item.title}
              link={item.link}
              tag={item.tag}
              src={item.src}
              alt={item.alt}
              internal={item.internal}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
