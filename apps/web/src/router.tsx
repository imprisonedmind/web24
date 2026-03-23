import { lazy } from "react";
import type { RouterHistory } from "@tanstack/react-router";
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import { AppFrame } from "./components/app-frame";

const HomePage = lazy(() => import("./pages/home-page").then((module) => ({ default: module.HomePage })));
const WorkPage = lazy(() => import("./pages/work-page").then((module) => ({ default: module.WorkPage })));
const WritingPage = lazy(() =>
  import("./pages/writing-page").then((module) => ({ default: module.WritingPage }))
);
const WritingDetailPage = lazy(() =>
  import("./pages/writing-detail-page").then((module) => ({ default: module.WritingDetailPage }))
);
const ActivityPage = lazy(() =>
  import("./pages/activity-page").then((module) => ({ default: module.ActivityPage }))
);
const WatchedPage = lazy(() =>
  import("./pages/watched-page").then((module) => ({ default: module.WatchedPage }))
);
const WatchedListPage = lazy(() =>
  import("./pages/watched-list-page").then((module) => ({ default: module.WatchedListPage }))
);
const WatchedMonthsPage = lazy(() =>
  import("./pages/watched-months-page").then((module) => ({ default: module.WatchedMonthsPage }))
);
const TechPage = lazy(() => import("./pages/tech-page").then((module) => ({ default: module.TechPage })));

const rootRoute = createRootRoute({
  component: AppFrame,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  loader: () => import("./pages/home-page").then((module) => module.preloadHomePage()),
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
  loader: ({ params }) =>
    import("./pages/writing-detail-page").then((module) => module.preloadWritingDetailPage(params.id)),
  component: WritingDetailPage,
});

const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activity",
  component: ActivityPage,
});

const watchedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched",
  loader: () => import("./pages/watched-page").then((module) => module.preloadWatchedPage()),
  component: WatchedPage,
});

const watchedRecentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/recent",
  loader: () => import("./pages/watched-list-page").then((module) => module.preloadWatchedListPage("recent")),
  component: () => <WatchedListPage scope="recent" />,
});

const watchedMonthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/month",
  loader: () => import("./pages/watched-list-page").then((module) => module.preloadWatchedListPage("month")),
  component: () => <WatchedListPage scope="month" />,
});

const watchedAllTimeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/all-time",
  loader: () =>
    import("./pages/watched-list-page").then((module) => module.preloadWatchedListPage("all-time")),
  component: () => <WatchedListPage scope="all-time" />,
});

const watchedMonthsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/months",
  loader: () => import("./pages/watched-months-page").then((module) => module.preloadWatchedMonthsPage()),
  component: WatchedMonthsPage,
});

const techRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tech",
  component: TechPage,
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
