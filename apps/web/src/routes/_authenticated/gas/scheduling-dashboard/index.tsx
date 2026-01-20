import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { SchedulingDashboard } from "~/features/scheduling-dashboard";

const schedulingDashboardSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(["scheduled", "pending", "late"]))
    .optional()
    .catch([]),
  contract: z.array(z.string()).optional().catch([]),
  filter: z.string().optional().catch(""),
});

export const Route = createFileRoute(
  "/_authenticated/gas/scheduling-dashboard/",
)({
  validateSearch: schedulingDashboardSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <SchedulingDashboard />;
}
