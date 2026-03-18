import { getFeaturedWorkItems, getTopWritingPosts } from "@web24/content";

import {
  BioSection,
  EducationSection,
  EmploymentSection,
  LocationSection,
  SocialSection,
  TechSection,
} from "../components/home";
import { HomeActivityWidget } from "../components/home-activity-widget";
import { SectionHeader, SmallLink } from "../components/legacy";
import { WorkPreviewLink, WritingPreviewLink } from "../components/previews";
import { MusicWidgetCard, TvWidgetCard } from "../components/widgets";

export function HomePage() {
  const featuredWork = getFeaturedWorkItems(6);
  const topWriting = getTopWritingPosts(3);

  return (
    <section className="mb-8 flex flex-col gap-8">
      <section className="mt-8 flex flex-col justify-between gap-4 md:flex-row">
        <img
          className="mx-auto hidden max-h-[400px] max-w-[300px] rounded-2xl object-cover md:flex"
          src="/luke2.jpg"
          alt="Luke Stephens"
        />

        <div className="flex flex-col justify-between gap-4 px-4 md:gap-0 md:px-0">
          <BioSection />
          <SocialSection />
          <EmploymentSection />
          <EducationSection />
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <section className="-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0">
          <SectionHeader title="work" action={<SmallLink href="/work" label="more" />} />
          <div className="hidden flex-col gap-1 md:flex">
            {featuredWork.map((item) => (
              <WorkPreviewLink key={item.link} item={item} />
            ))}
          </div>
          <div className="md:hidden">
            <div className="flex flex-row gap-2 overflow-x-auto pb-4">
              {featuredWork.slice(0, 3).map((item) => (
                <a
                  key={item.link}
                  className="flex min-w-[185px] flex-col gap-2 rounded-xl bg-white p-2 text-inherit no-underline shadow-sm transition duration-150 ease-in-out hover:shadow-md"
                  href={item.link}
                  target={item.internal ? "_self" : "_blank"}
                  rel={item.internal ? undefined : "noreferrer"}
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-lg">
                    <img className="h-full w-full bg-gray-200 object-cover" src={item.image} alt={item.alt} />
                  </div>
                  <div className="flex justify-between gap-2">
                    <p className="text-sm">{item.title}</p>
                    <p className="rounded-full bg-neutral-100 p-1 px-2 text-xs">{item.tag}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0">
          <SectionHeader title="writing" action={<SmallLink href="/writing" label="more" />} />
          <section className="grid gap-1">
            {topWriting.map((post) => (
              <WritingPreviewLink key={post.id} item={post} />
            ))}
          </section>
        </section>

        <HomeActivityWidget />

        <section className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 md:p-0">
          <LocationSection />
          <TvWidgetCard />
          <MusicWidgetCard />
        </section>

        <TechSection />
      </section>
    </section>
  );
}
