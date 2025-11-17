// app/(widgets)/TvWidget.tsx
import { getLastWatched } from "@/app/activity/actions/getLastWatched";
import { getCurrentlyWatching } from "@/app/activity/actions/getCurrentlyWatching";
import { TvWidgetClient } from "@/components/tv/tvWidgetClient";

export default async function TvWidget() {
  const [currentlyWatching, lastWatched] = await Promise.all([
    getCurrentlyWatching(),
    getLastWatched()
  ]);

  if (!currentlyWatching && !lastWatched) {
    return null;
  }

  return (
    <TvWidgetClient
      initialCurrentlyWatching={currentlyWatching}
      initialLastWatched={lastWatched}
    />
  );
}
