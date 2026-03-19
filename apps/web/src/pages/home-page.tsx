import { getFeaturedWorkItems, getTopWritingPosts } from "@web24/content";

import {
  BioSection,
  EducationSection,
  EmploymentSection,
  LocationSection,
  SocialSection,
  TechSection,
} from "../components/home";
import { HomeAppsSection } from "../components/home-apps";
import { HomeActivityWidget } from "../components/home-activity-widget";
import { HomeWorkSection } from "../components/home-work";
import { SectionHeader, SmallLink } from "../components/legacy";
import { WritingPreviewLink } from "../components/previews";
import { MusicWidgetCard, TvWidgetCard } from "../components/widgets";
import {
  homeActivityQueryOptions,
  musicQueryOptions,
  tvStatusQueryOptions,
} from "../lib/api";
import { queryClient } from "../lib/query-client";
import { CFImage } from "../components/cf-image";

export function HomePage() {
  const featuredWork = getFeaturedWorkItems(6);
  const topWriting = getTopWritingPosts(3);

  return (
    <section className="mb-8 flex flex-col gap-8">
      <section className="mt-8 flex flex-col justify-between gap-4 md:flex-row">
        <CFImage
          className="mx-auto hidden max-h-[400px] max-w-[300px] rounded-2xl object-cover md:flex"
          src="/images/profile/luke2.jpg"
          alt="Luke Stephens"
          preset="heroPortrait"
        />

        <div className="flex flex-col justify-between gap-4 md:gap-0">
          <BioSection />
          <SocialSection />
          <EmploymentSection />
          <EducationSection />
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <HomeWorkSection items={featuredWork} />

        <HomeAppsSection />

        <section className="-mt-4 flex w-full flex-col gap-1 md:mt-0">
          <SectionHeader title="writing" action={<SmallLink href="/writing" label="more" />} />
          <section className="grid gap-1">
            {topWriting.map((post) => (
              <WritingPreviewLink key={post.id} item={post} />
            ))}
          </section>
        </section>

        <HomeActivityWidget />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LocationSection />
          <TvWidgetCard />
          <MusicWidgetCard />
        </section>

        <TechSection />
      </section>
    </section>
  );
}

export async function preloadHomePage() {
  await Promise.all([
    queryClient.ensureQueryData(homeActivityQueryOptions),
    queryClient.ensureQueryData(tvStatusQueryOptions),
    queryClient.ensureQueryData(musicQueryOptions),
  ]);
}
