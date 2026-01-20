import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { DailyScheduling } from "~/features/daily-scheduling";

const dailySchedulingSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(["pending", "submitted", "approved", "rejected"]))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/gas/scheduling/")({
  validateSearch: dailySchedulingSearchSchema,
  component: RouteComponent,
});

export default function RouteComponent() {
  return <DailyScheduling />;
}
