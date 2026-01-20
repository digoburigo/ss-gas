import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { SchedulingAccuracy } from "~/features/scheduling-accuracy";

const schedulingAccuracySearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  period: z.enum(["daily", "weekly", "monthly"]).optional().catch("daily"),
  unitId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute(
  "/_authenticated/gas/scheduling-accuracy/",
)({
  validateSearch: schedulingAccuracySearchSchema,
  component: RouteComponent,
});

export default function RouteComponent() {
  return <SchedulingAccuracy />;
}
