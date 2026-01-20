import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { QuerySettingsProvider } from "@zenstackhq/tanstack-query/react";

// import { env } from '@/env';
import { myFetch, queryClient } from "~/clients/query-client";
import { routeTree } from "~/routeTree.gen";

// import Spinner from '@/routes/-components/common/spinner';

export function createRouter() {
  const router = createTanstackRouter({
    routeTree,
    // basepath: env.PUBLIC_BASE_PATH,
    scrollRestoration: true,
    defaultPreload: "intent",
    // defaultPendingComponent: () => <Spinner />,
    Wrap: function WrapComponent({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          <QuerySettingsProvider
            value={{
              endpoint: `${import.meta.env.PUBLIC_SERVER_URL}/api/model`,
              fetch: myFetch,
            }}
          >
            {children}
          </QuerySettingsProvider>
        </QueryClientProvider>
      );
    },
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
