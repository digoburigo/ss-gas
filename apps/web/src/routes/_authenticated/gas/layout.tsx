import { createFileRoute, Outlet } from "@tanstack/react-router";

import { GasChatWidget } from "~/features/gas-chat/components/gas-chat-widget";

export const Route = createFileRoute("/_authenticated/gas")({
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
