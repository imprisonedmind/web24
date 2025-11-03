import {
  getMostWatchedForMonth,
  type WatchCarouselItem
} from "@/app/activity/actions/getWatchHighlights";
import { WatchCarouselSection } from "@/components/tv/watchCarouselSection";

interface MonthlyHighlightCarouselProps {
  monthIso: string;
  label: string;
  limit?: number;
}

export default async function MonthlyHighlightCarousel({
  monthIso,
  label,
  limit = 12
}: MonthlyHighlightCarouselProps) {
  const items: WatchCarouselItem[] = await getMostWatchedForMonth(
    monthIso,
    limit
  );

  return (
    <WatchCarouselSection
      title={label}
      items={items}
      emptyMessage={`No watch activity recorded in ${label}.`}
    />
  );
}
