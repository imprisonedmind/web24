import { useRouterState } from "@tanstack/react-router";

import { publicRoutes } from "@web24/config";

import { MediaCard } from "../components/legacy";

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
    "Watched routes will follow the same pattern as activity: crawlable HTML first, live data second.",
};

export function RoutePage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const route = publicRoutes.find((item) => item.path === pathname);
  const title = route?.label ?? "Route";
  const body = routeBodies[pathname] ?? route?.seo.description ?? "Route content is being migrated.";

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
