import Image from "next/image";
import Social from "@/components/social";
import Employment from "@/components/employment";
import Education from "@/components/education";
import Work from "@/components/work";
import WritingList from "@/components/writingList";
import Bio from "@/components/bio";
import Tech from "@/components/tech";

import luke from "/public/luke2.jpg";
import Location from "@/components/location";
import Music from "@/components/music/music";
import Coding from "@/components/coding/coding";

export default function Home() {
  return (
    <main className="mx-auto mb-8 flex max-w-[600px] flex-col gap-8">
      <div className={"mt-8 flex flex-col justify-between gap-4 md:flex-row"}>
        <Image
          src={luke}
          alt={"Luke Stephens"}
          placeholder={"blur"}
          priority={true}
          sizes={"80vw"}
          className={"mx-auto hidden max-h-[400px] max-w-[300px] md:flex"}
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
        <WritingList />
        <div className={"grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 md:p-0"}>
          <Location />
          <Music />
        </div>
        <Coding />
        <Tech />
      </div>
    </main>
  );
}
