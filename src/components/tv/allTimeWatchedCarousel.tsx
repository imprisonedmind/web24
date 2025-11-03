import {
  getMostWatchedAllTime,
  type WatchCarouselItem
} from "@/app/activity/actions/getWatchHighlights";
import { WatchCarouselSection } from "@/components/tv/watchCarouselSection";

const LINKS = [{ title: "more", href: "/watched/all-time" }];
const EMPTY = "No all-time watch stats available.";

export default async function AllTimeWatchedCarousel() {
  const items: WatchCarouselItem[] = await getMostWatchedAllTime();

  return (
    <WatchCarouselSection
      title="most watched all time"
      items={items}
      links={LINKS}
      emptyMessage={EMPTY}
    />
  );
}
