import { useEffect } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

import { publicRoutes } from "@web24/config";

export function AppFrame() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    const route = publicRoutes.find((candidate) => candidate.path === pathname);
    if (!route) return;

    document.title = route.seo.title;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", route.seo.description);
    }
  }, [pathname]);
  return (
    <main className="mx-auto w-full max-w-[var(--page-max-width)] px-2 pb-8 pt-2 md:px-0 md:py-10">
      <Outlet />
    </main>
  );
}
