import luke from "/public/luke2.jpg";
import Image from "next/image";
import Social from "@/components/social";
import Employment from "@/components/employment";
import Education from "@/components/education";
import Work from "@/components/work";
import Bio from "@/components/bio";
import Tech from "@/components/tech";
import Location from "@/components/location";
import Music from "@/components/music/music";
import WritingList from "@/components/writing/writingList";
import { Analytics } from "@vercel/analytics/next";
import CombinedActivity from "@/components/activity/combinedActivity";
import TvWidget from "@/components/tv/tvWidget";
import { PageContainer } from "@/components/ui/page-container";

export default function Home() {
  return (
    <main className="mb-8">
      <PageContainer className="flex flex-col gap-8">
        <Analytics />
        <div className={"mt-8 flex flex-col justify-between gap-4 md:flex-row"}>
          <Image
            src={luke}
            alt={"Luke Stephens"}
            placeholder={"blur"}
            priority={true}
            sizes={"80vw"}
            className={`
            mx-auto hidden max-h-[400px] max-w-[300px] rounded-2xl md:flex
          `}
          />
          <div
            className={
              "flex flex-col justify-between gap-4 px-4 md:gap-0 md:px-0"
            }
          >
            <Bio />
            <Social />
            <Employment />
            <Education />
          </div>
        </div>
        <div className={"flex flex-col gap-8"}>
          <Work />
          {/*<Coding />*/}
          <CombinedActivity />
          <WritingList />
          <div className={"grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 md:p-0"}>
            <Location />
            <TvWidget />
            <Music />
          </div>
          <Tech />
        </div>
      </PageContainer>
    </main>
  );
}
