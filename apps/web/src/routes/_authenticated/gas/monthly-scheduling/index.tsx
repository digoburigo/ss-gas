import { createFileRoute } from "@tanstack/react-router";

import { MonthlyScheduling } from "~/features/monthly-scheduling";

export const Route = createFileRoute("/_authenticated/gas/monthly-scheduling/")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  return <MonthlyScheduling />;
}
