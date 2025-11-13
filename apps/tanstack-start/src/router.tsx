import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
// import { QuerySettingsProvider } from "@zenstackhq/tanstack-query/react";
import SuperJSON from "superjson";

import { makeTRPCClient, TRPCProvider } from "~/lib/trpc";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: SuperJSON.serialize },
      hydrate: { deserializeData: SuperJSON.deserialize },
    },
  });

  const trpcClient = makeTRPCClient();
  const trpc = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient,
  });

  const router = createRouter({
    routeTree,
    context: { queryClient, trpc },
    defaultPreload: "intent",
    // Wrap: ({ children, ...props }) => {
    Wrap: (props) => {
      return (
        <>
          <TRPCProvider
            trpcClient={trpcClient}
            queryClient={queryClient}
            {...props}
          />
          {/* <QuerySettingsProvider value={{ endpoint: "/api/model" }}> */}
          {/* {children} */}
          {/* </QuerySettingsProvider> */}
          {/* </TRPCProvider> */}
        </>
      );
    },
  });
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
