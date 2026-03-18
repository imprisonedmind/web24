import type { RouterHistory } from "@tanstack/react-router";
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import { AppFrame } from "./components/app-frame";
import { ActivityPage } from "./pages/activity-page";
import { HomePage } from "./pages/home-page";
import { RoutePage } from "./pages/route-page";
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
  fallbackRoute,
]);

export function createAppRouter({ history }: { history: RouterHistory }) {
  return createRouter({
    routeTree,
    history,
    defaultPreload: "intent",
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
