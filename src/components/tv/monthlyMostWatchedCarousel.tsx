import {
  getMostWatchedPast30Days,
  type WatchCarouselItem
} from "@/app/activity/actions/getWatchHighlights";
import { WatchCarouselSection } from "@/components/tv/watchCarouselSection";

const LINKS = [
  { title: "more", href: "/watched/month" },
  { title: "all months", href: "/watched/months" }
];
const EMPTY = "No watch time recorded in the last 30 days.";

export default async function MonthlyMostWatchedCarousel() {
  const items: WatchCarouselItem[] = await getMostWatchedPast30Days();

  return (
    <WatchCarouselSection
      title="most watched this month"
      items={items}
      links={LINKS}
      emptyMessage={EMPTY}
    />
  );
}
