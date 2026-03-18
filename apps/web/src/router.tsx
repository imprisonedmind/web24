import type { RouterHistory } from "@tanstack/react-router";
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import { AppFrame } from "./components/app-frame";
import { ActivityPage } from "./pages/activity-page";
import { HomePage } from "./pages/home-page";
import { RoutePage } from "./pages/route-page";
import { TechPage } from "./pages/tech-page";
import { WatchedListPage } from "./pages/watched-list-page";
import { WatchedMonthsPage } from "./pages/watched-months-page";
import { WatchedPage } from "./pages/watched-page";
import { WorkPage } from "./pages/work-page";
import { WritingDetailPage } from "./pages/writing-detail-page";
import { WritingPage } from "./pages/writing-page";

const rootRoute = createRootRoute({
  component: AppFrame,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
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
  component: WatchedPage,
});

const watchedRecentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/recent",
  component: () => <WatchedListPage scope="recent" />,
});

const watchedMonthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/month",
  component: () => <WatchedListPage scope="month" />,
});

const watchedAllTimeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/all-time",
  component: () => <WatchedListPage scope="all-time" />,
});

const watchedMonthsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watched/months",
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
