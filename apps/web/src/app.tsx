import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createBrowserHistory,
  createMemoryHistory,
} from "@tanstack/react-router";

import { createAppRouter } from "./router";

export function App({
  initialPath,
  staticMode = false,
}: {
  initialPath?: string;
  staticMode?: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

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
