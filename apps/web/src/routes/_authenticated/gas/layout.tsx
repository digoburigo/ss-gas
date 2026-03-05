import { createFileRoute, Outlet } from "@tanstack/react-router";

import { GasChatWidget } from "~/features/gas-chat/components/gas-chat-widget";

export const Route = createFileRoute("/_authenticated/gas/layout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Outlet />
      <GasChatWidget />
    </>
  );
}
