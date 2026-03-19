import type { RouterHistory } from "@tanstack/react-router";
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import { AppFrame } from "./components/app-frame";
import { ActivityPage, preloadActivityPage } from "./pages/activity-page";
import { HomePage, preloadHomePage } from "./pages/home-page";
import { TechPage } from "./pages/tech-page";
import { RoutePage } from "./pages/route-page";
import {
  WatchedListPage,
  preloadWatchedListPage,
} from "./pages/watched-list-page";
import { WatchedMonthsPage, preloadWatchedMonthsPage } from "./pages/watched-months-page";
import { WatchedPage, preloadWatchedPage } from "./pages/watched-page";
import { WorkPage } from "./pages/work-page";
import { WritingDetailPage, preloadWritingDetailPage } from "./pages/writing-detail-page";
import { WritingPage } from "./pages/writing-page";

function WatchedRecentPage() {
  return <WatchedListPage scope="recent" />;
}

function WatchedMonthPage() {
  return <WatchedListPage scope="month" />;
}

function WatchedAllTimePage() {
  return <WatchedListPage scope="all-time" />;
}

const rootRoute = createRootRoute({
  component: AppFrame,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  loader: preloadHomePage,
  component: HomePage,
});

const workRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/work",
  component: WorkPage,
});

const writingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/writing",
  component: WritingPage,
});

const writingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/writing/$slug/$id",
  loader: ({ params }) => preloadWritingDetailPage(params.id),
  component: WritingDetailPage,
});

const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activity",
  loader: preloadActivityPage,
  component: ActivityPage,
});

const watchedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched",
  loader: preloadWatchedPage,
  component: WatchedPage,
});

const watchedRecentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/recent",
  loader: () => preloadWatchedListPage("recent"),
  component: WatchedRecentPage,
});

const watchedMonthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/month",
  loader: () => preloadWatchedListPage("month"),
  component: WatchedMonthPage,
});

const watchedAllTimeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/all-time",
  loader: () => preloadWatchedListPage("all-time"),
  component: WatchedAllTimePage,
});

const watchedMonthsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/months",
  loader: preloadWatchedMonthsPage,
  component: WatchedMonthsPage,
});

const techRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tech",
  component: TechPage,
});

const fallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$",
  component: RoutePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  workRoute,
  writingRoute,
  writingDetailRoute,
  activityRoute,
  watchedRoute,
  watchedRecentRoute,
  watchedMonthRoute,
  watchedAllTimeRoute,
  watchedMonthsRoute,
  techRoute,
  fallbackRoute,
]);

export function createAppRouter({ history }: { history: RouterHistory }) {
  return createRouter({
    routeTree,
    history,
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
