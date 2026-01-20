import { createFileRoute } from "@tanstack/react-router";

import { GasDashboard } from "~/features/gas";

export const Route = createFileRoute("/_authenticated/gas/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <GasDashboard />;
}
