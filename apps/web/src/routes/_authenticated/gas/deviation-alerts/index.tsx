import { createFileRoute } from "@tanstack/react-router";

import { DeviationAlerts } from "~/features/deviation-alerts";

export const Route = createFileRoute("/_authenticated/gas/deviation-alerts/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <DeviationAlerts />;
}
