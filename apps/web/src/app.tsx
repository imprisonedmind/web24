import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams
} from "react-router-dom";

import { publicRoutes, siteConfig } from "@web24/config";
import {
  workItems,
  getFeaturedWorkItems,
  getWritingPostBySlugParts,
  getWritingRoutePath,
  getTopWritingPosts,
  sortWritingPosts
} from "@web24/content";
import {
  MediaCard,
  ReviewScoreBadge,
  SectionHeader,
  SmallLink
} from "./components/legacy";
import { WorkSection, WritingCard } from "./components/catalog";
import {
  BioSection,
  EducationSection,
  EmploymentSection,
  LocationSection,
  SocialSection,
  TechSection
} from "./components/home";
import { WorkPreviewLink, WritingPreviewLink } from "./components/previews";
import { ActivityPreview, MusicWidgetCard, TvWidgetCard } from "./components/widgets";
import type { WatchDay } from "./types";

import "./styles.css";

function useRouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const route = publicRoutes.find(candidate => candidate.path === location.pathname);
    if (!route) return;

    document.title = route.seo.title;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", route.seo.description);
    }
  }, [location.pathname]);
}

function NavItem({
  href,
  label,
  staticMode
}: {
  href: string;
  label: string;
  staticMode?: boolean;
}) {
  if (staticMode) {
    return (
      <a
        className="inline-flex items-center rounded-full border border-[rgba(19,38,28,0.12)] bg-[rgba(255,255,255,0.74)] px-[0.95rem] py-[0.65rem] no-underline"
        href={href}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      className="inline-flex items-center rounded-full border border-[rgba(19,38,28,0.12)] bg-[rgba(255,255,255,0.74)] px-[0.95rem] py-[0.65rem] no-underline"
      to={href}
    >
      {label}
    </Link>
  );
}

function AppFrame({ staticMode = false }: { staticMode?: boolean }) {
  useRouteSeo();

  return (
    <main className="mx-auto max-w-5xl px-[calc(min(16px,8vw))] py-8 md:py-10">
      <Outlet />
    </main>
  );
}

function RoutePage({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <MediaCard className="max-w-[44rem] p-5 md:p-6">
      <p className="mb-3 text-[0.78rem] uppercase tracking-[0.12em] text-[#556b5d]">
        Public route
      </p>
      <h2 className="m-0 text-base font-semibold md:text-lg">{title}</h2>
      <p className="mt-3 text-[#425348]">{body}</p>
    </MediaCard>
  );
}

function HomeRoute({ staticMode = false }: { staticMode?: boolean }) {
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
            {featuredWork.map(item => (
              <WorkPreviewLink key={item.link} item={item} />
            ))}
          </div>
          <div className="md:hidden">
            <div className="flex flex-row gap-2 overflow-x-auto pb-4">
              {featuredWork.slice(0, 3).map(item => (
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
            {topWriting.map(post => (
              <WritingPreviewLink key={post.id} item={post} />
            ))}
          </section>
        </section>

        <ActivityPreview />

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

type TvStatus = {
  currentlyWatching: {
    type: "movie" | "show" | "episode";
    title: string;
    showTitle?: string;
    episodeTitle?: string;
    season?: number;
    episode?: number;
    posterUrl: string;
    url: string;
    progress?: number;
    startedAt?: string;
    expiresAt?: string;
  } | null;
  lastWatched: {
    type: "movie" | "show" | "episode";
    title: string;
    showTitle?: string;
    episodeTitle?: string;
    season?: number;
    episode?: number;
    posterUrl: string;
    watchedAt: string;
    url: string;
  } | null;
};

type WatchedItem = {
  id: string;
  title: string;
  subtitle?: string;
  posterUrl: string;
  href: string;
  meta?: string;
};

function getEpisodeCode(
  status: TvStatus["currentlyWatching"] | TvStatus["lastWatched"]
) {
  if (!status || status.type !== "episode") return null;
  if (typeof status.season === "number" && typeof status.episode === "number") {
    return `${status.season}x${status.episode}`;
  }
  return null;
}

function getDisplayTitle(
  entry: TvStatus["currentlyWatching"] | TvStatus["lastWatched"]
) {
  if (!entry) return "Nothing watched yet";
  if (entry.type === "episode") return entry.showTitle ?? entry.title ?? "Untitled";
  return entry.title ?? "Untitled";
}

function getDisplaySubtitle(
  entry: TvStatus["currentlyWatching"] | TvStatus["lastWatched"]
) {
  if (!entry) return null;
  if (entry.type !== "episode") return null;

  const code = getEpisodeCode(entry);
  return [code, entry.episodeTitle].filter(Boolean).join(" • ") || null;
}

function formatDistanceLabel(value: string) {
  const diffMs = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TvStatusPanel() {
  const [status, setStatus] = useState<TvStatus>({
    currentlyWatching: null,
    lastWatched: null
  });
  const [days, setDays] = useState<WatchDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statusResponse, daysResponse] = await Promise.all([
          fetch("/api/tv/status", { credentials: "include" }),
          fetch("/api/watched/days-last-year", { credentials: "include" })
        ]);

        if (!statusResponse.ok) {
          throw new Error(`tv status failed with ${statusResponse.status}`);
        }

        const data = (await statusResponse.json()) as Partial<TvStatus>;
        if (!cancelled) {
          setStatus({
            currentlyWatching: data.currentlyWatching ?? null,
            lastWatched: data.lastWatched ?? null
          });
        }

        if (daysResponse.ok) {
          const daysPayload = (await daysResponse.json()) as { days?: WatchDay[] };
          if (!cancelled) {
            setDays(daysPayload.days ?? []);
          }
        }
      } catch (error) {
        console.error("[spa/activity] failed to load tv status", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(load, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const activeEntry = status.currentlyWatching ?? status.lastWatched;
  const metaLabel = status.currentlyWatching
    ? [
        getEpisodeCode(status.currentlyWatching),
        typeof status.currentlyWatching.progress === "number"
          ? `${Math.round(status.currentlyWatching.progress)}%`
          : null
      ]
        .filter(Boolean)
        .join(" • ")
    : status.lastWatched?.watchedAt
      ? formatDistanceLabel(status.lastWatched.watchedAt)
      : null;

  return (
    <section className="grid gap-4 md:gap-5">
      <SectionHeader
        title={status.currentlyWatching ? "watching" : "watched"}
        action={<SmallLink href="/watched" label="more" />}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <MediaCard className="min-h-[28rem]">
          {activeEntry ? (
            <a href={activeEntry.url} target="_blank" rel="noreferrer">
              <img
                className="block h-full min-h-[28rem] w-full object-cover"
                src={activeEntry.posterUrl}
                alt={activeEntry.title}
              />
            </a>
          ) : (
            <div className="flex min-h-[28rem] w-full items-center justify-center bg-[#eef1ea] text-[#556b5d]">
              {loading ? "Loading activity…" : "Nothing watched yet"}
            </div>
          )}
        </MediaCard>

        <MediaCard className="p-5">
          <p className="mb-3 text-[0.78rem] uppercase tracking-[0.12em] text-[#556b5d]">
            {status.currentlyWatching ? "Currently watching" : "Last watched"}
          </p>
          <h3 className="m-0 text-[1.6rem]">{getDisplayTitle(activeEntry)}</h3>
          {getDisplaySubtitle(activeEntry) ? (
            <p className="mt-3 text-[#425348]">{getDisplaySubtitle(activeEntry)}</p>
          ) : null}
          {metaLabel ? <p className="mt-3 text-sm text-[#556b5d]">{metaLabel}</p> : null}
          <p className="mt-3 text-[#425348]">
            {status.currentlyWatching
              ? "Live watch state is now coming from the Hono backend and can replace the old Next server-action path."
              : "Once more activity endpoints are migrated, this route will expand into the full watched and highlights experience."}
          </p>
        </MediaCard>
      </section>

      <section className="grid gap-2">
        <SectionHeader title="activity" />
        <div
          className="mt-4 grid grid-cols-[repeat(14,1fr)] gap-[0.35rem]"
          aria-label="Watch history heatmap"
        >
          {days.length
            ? days.slice(-98).map(day => {
                const intensity = Math.min(day.total / (4 * 60 * 60), 1);
                return (
                  <div
                    key={day.date}
                    className="aspect-square rounded-[0.3rem] border border-[rgba(19,38,28,0.08)]"
                    title={`${day.date} • ${Math.round(day.total / 60)} min`}
                    style={{
                      backgroundColor:
                        day.total > 0
                          ? `rgba(234, 121, 8, ${Math.max(intensity, 0.14)})`
                          : "rgba(229, 231, 235, 0.8)"
                    }}
                  />
                );
              })
            : Array.from({ length: 98 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-[0.3rem] border border-[rgba(19,38,28,0.08)] bg-[rgba(229,231,235,0.8)]"
                />
              ))}
        </div>
      </section>
    </section>
  );
}

function WatchedRoute() {
  const [recentItems, setRecentItems] = useState<WatchedItem[]>([]);
  const [monthItems, setMonthItems] = useState<WatchedItem[]>([]);
  const [allTimeItems, setAllTimeItems] = useState<WatchedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [recentResponse, monthResponse, allTimeResponse] = await Promise.all([
          fetch("/api/watched/recent?limit=12", { credentials: "include" }),
          fetch("/api/watched/month?limit=12", { credentials: "include" }),
          fetch("/api/watched/all-time?limit=12", { credentials: "include" })
        ]);

        if (recentResponse.ok) {
          const data = (await recentResponse.json()) as { items?: WatchedItem[] };
          if (!cancelled) setRecentItems(data.items ?? []);
        }

        if (monthResponse.ok) {
          const data = (await monthResponse.json()) as { items?: WatchedItem[] };
          if (!cancelled) setMonthItems(data.items ?? []);
        }

        if (allTimeResponse.ok) {
          const data = (await allTimeResponse.json()) as { items?: WatchedItem[] };
          if (!cancelled) setAllTimeItems(data.items ?? []);
        }
      } catch (error) {
        console.error("[spa/watched] failed to load recent watched", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="grid gap-5">
      <SectionHeader title="watched" />

      {loading && !recentItems.length && !monthItems.length && !allTimeItems.length ? (
        <section className="grid gap-3">
          <section className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <MediaCard
                key={index}
                className="min-h-[20rem] bg-[linear-gradient(180deg,rgba(238,241,234,0.9),rgba(255,255,255,0.85))]"
              />
            ))}
          </section>
        </section>
      ) : recentItems.length || monthItems.length || allTimeItems.length ? (
        <>
          <WatchedSection title="Recently watched" items={recentItems} />
          <WatchedSection title="Most watched this month" items={monthItems} />
          <WatchedSection title="Most watched all time" items={allTimeItems} />
        </>
      ) : (
        <MediaCard className="max-w-[44rem] p-5 md:p-6">
          <p className="m-0 text-[#425348]">No recent watched data available.</p>
        </MediaCard>
      )}
    </section>
  );
}

function WatchedSection({
  title,
  items
}: {
  title: string;
  items: WatchedItem[];
}) {
  if (!items.length) return null;

  return (
    <section className="grid gap-3">
      <div className="pl-[0.1rem]">
        <h3 className="m-0 text-base font-medium">{title}</h3>
      </div>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4" aria-label={title}>
        {items.map(item => (
          <a
            key={item.id}
            className="overflow-hidden rounded-[1.2rem] border border-[rgba(19,38,28,0.12)] bg-[rgba(255,255,255,0.82)] text-inherit no-underline shadow-[0_16px_36px_rgba(19,38,28,0.08)]"
            href={item.href}
            target="_blank"
            rel="noreferrer"
          >
            <img className="block aspect-[0.75/1] w-full object-cover bg-[#eef1ea]" src={item.posterUrl} alt={item.title} />
            <div className="p-[0.9rem]">
              <p className="m-0 font-semibold">{item.title}</p>
              {item.subtitle ? <p className="m-0 text-[0.88rem] text-[#556b5d]">{item.subtitle}</p> : null}
              {item.meta ? <p className="mt-[0.35rem] text-[0.88rem] text-[#556b5d]">{item.meta}</p> : null}
            </div>
          </a>
        ))}
      </section>
    </section>
  );
}

function WorkRoute() {
  const sections = [
    { title: "professional", items: workItems.filter(item => item.type === "professional") },
    { title: "personal", items: workItems.filter(item => item.type === "personal") },
    { title: "college", items: workItems.filter(item => item.type === "college") }
  ].filter(section => section.items.length);

  return (
    <section className="flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4">
      {sections.map(section => (
        <WorkSection key={section.title} title={section.title} items={section.items} />
      ))}
    </section>
  );
}

function WritingRoute() {
  const posts = sortWritingPosts();

  return (
    <section
      className="grid grid-cols-1 gap-4 px-[calc(min(16px,8vw))] py-4 sm:grid-cols-2"
      aria-label="Writing posts"
    >
        {posts.map(post => (
          <WritingCard key={post.id} post={post} />
        ))}
    </section>
  );
}

function WritingDetailRoute() {
  const params = useParams<{ slug: string; id: string }>();
  const post = getWritingPostBySlugParts(params.slug, params.id);

  if (!post) {
    return <Navigate to="/writing" replace />;
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <SmallLink href="/writing" label="back to writing" />
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{post.title}</h1>
          <p className="m-0 max-w-3xl text-neutral-600">{post.description}</p>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 text-sm text-neutral-600 sm:text-base">
          {post.score !== undefined ? <ReviewScoreBadge score={post.score} /> : null}
          <p className="whitespace-nowrap m-0">{post.date}</p>
        </div>
      </div>

      <article className="overflow-hidden rounded-[1.4rem] bg-white shadow-sm">
        <img
          className="block max-h-[24rem] w-full object-cover"
          src={`/${post.openGraph}`}
          alt={post.title}
        />
        <div className="flex justify-between gap-4 px-4 pb-0 pt-4 text-sm text-neutral-500">
          <span>{post.date}</span>
          {post.score !== undefined ? <span>score {post.score.toFixed(1)}</span> : null}
        </div>
        <p className="m-0 p-4 leading-7 text-neutral-600">
          This page is now part of the prerendered route manifest for the Vite
          SPA. The next migration step is replacing this extracted summary view
          with the full Notion-backed content rendering path.
        </p>
      </article>
    </section>
  );
}

const routeBodies: Record<string, string> = {
  "/":
    "Home will be rebuilt first, then connected to extracted content and live widgets from the new API.",
  "/work":
    "Work is a strong early migration target because it is mostly static and suitable for prerender parity.",
  "/writing":
    "Writing will be backed by a content index so both the route list and SEO metadata can be generated at build time.",
  "/activity":
    "Activity will prerender a stable shell and hydrate current watching data from Hono after load.",
  "/watched":
    "Watched routes will follow the same pattern as activity: crawlable HTML first, live data second."
};

export function App({ staticMode = false }: { staticMode?: boolean }) {
  return (
    <Routes>
      <Route element={<AppFrame staticMode={staticMode} />}>
        <Route path="/" element={<HomeRoute staticMode={staticMode} />} />
        <Route path="/writing/:slug/:id" element={<WritingDetailRoute />} />
        {publicRoutes.filter(route => route.path !== "/").map(route => (
          <Route
            key={route.path}
            path={route.path}
            element={route.path === "/work" ? (
              <WorkRoute />
            ) : route.path === "/writing" ? (
              <WritingRoute />
            ) : route.path === "/activity" ? (
              <TvStatusPanel />
            ) : route.path === "/watched" ? (
              <WatchedRoute />
            ) : (
              <RoutePage
                title={route.label}
                body={routeBodies[route.path] ?? route.seo.description}
              />
            )}
          />
        ))}
      </Route>
    </Routes>
  );
}
