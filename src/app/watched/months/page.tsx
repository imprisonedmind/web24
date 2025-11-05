import { Suspense } from "react";
import { format, startOfMonth, subMonths } from "date-fns";

import Breadcrumbs from "@/components/breadcrumbs";
import MonthlyHighlightCarousel from "@/components/tv/monthlyHighlightCarousel";
import { WatchCarouselSkeleton } from "@/components/tv/watchCarouselSkeleton";
import { PageContainer } from "@/components/ui/page-container";

const MONTH_COUNT = 12;

export default function WatchedMonthsPage() {
  const now = new Date();
  const months = Array.from({ length: MONTH_COUNT }, (_, index) => {
    const date = startOfMonth(subMonths(now, index));
    return {
      iso: date.toISOString(),
      label: format(date, "MMMM yyyy")
    };
  });

  return (
    <PageContainer className="mb-8 flex flex-col gap-8 py-4 px-[calc(min(16px,8vw))] sm:px-0">
      <Breadcrumbs />

      <div className="flex flex-col gap-10">
        {months.map(month => (
          <Suspense
            key={month.iso}
            fallback={<WatchCarouselSkeleton title={month.label} />}
          >
            <MonthlyHighlightCarousel
              monthIso={month.iso}
              label={month.label}
            />
          </Suspense>
        ))}
      </div>
    </PageContainer>
  );
}
