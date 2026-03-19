import { useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createBrowserHistory,
  createMemoryHistory,
} from "@tanstack/react-router";

import { queryClient } from "./lib/query-client";
import { createAppRouter } from "./router";

export function App({
  initialPath,
  staticMode = false,
}: {
  initialPath?: string;
  staticMode?: boolean;
}) {
  const router = useMemo(
    () =>
      createAppRouter({
        history:
          initialPath || staticMode
            ? createMemoryHistory({
                initialEntries: [initialPath ?? "/"],
              })
            : createBrowserHistory(),
      }),
    [initialPath, staticMode],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
