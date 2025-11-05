import { Header } from "@/components/header";
import { workData } from "@/lib/workData";
import { WorkPreviewLink } from "@/components/work/workPreviewLink";

export default function Work() {
  const items = workData();
  const favourites = items.filter((item) => item.favourite);
  const displayItems = (favourites.length ? favourites : items).slice(0, 6);

  return (
    <div className="-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0">
      <Header title="work" seeAll link="work" />
      {displayItems.map((item) => (
        <WorkPreviewLink key={item.link} item={item} />
      ))}
    </div>
  );
}
