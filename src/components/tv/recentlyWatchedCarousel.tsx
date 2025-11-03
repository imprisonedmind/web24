import {
  getRecentlyWatched,
  type WatchCarouselItem
} from "@/app/activity/actions/getWatchHighlights";
import { WatchCarouselSection } from "@/components/tv/watchCarouselSection";

const LINKS = [{ title: "more", href: "/watched/recent" }];
const EMPTY = "No recent watch history available.";

export default async function RecentlyWatchedCarousel() {
  const items: WatchCarouselItem[] = await getRecentlyWatched();

  return (
    <WatchCarouselSection
      title="recently watched"
      items={items}
      links={LINKS}
      emptyMessage={EMPTY}
    />
  );
}
