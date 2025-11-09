import React from "react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { FormDevtools } from "@tanstack/react-form-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { setDefaultOptions } from "date-fns";
import { ptBR } from "date-fns/locale";
import { scan } from "react-scan"; // must be imported before React and React DOM
import { Toaster } from "sonner";

import { authClient } from "~/clients/auth-client";

setDefaultOptions({ locale: ptBR });

scan({
  enabled: true,
});

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Outlet />
      <Toaster />
      <TanStackDevtools
        config={{
          position: "middle-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: "Tanstack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "TanStack Form",
            render: <FormDevtools />,
          },
        ]}
      />
    </>
  );
}
