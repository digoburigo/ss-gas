import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { ActualConsumption } from "~/features/actual-consumption";

const actualConsumptionSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  source: z
    .array(z.enum(["meter", "manual", "calculated"]))
    .optional()
    .catch([]),
  deviation: z
    .array(
      z.enum(["within_limit", "above_limit", "below_limit", "no_schedule"]),
    )
    .optional()
    .catch([]),
  filter: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/gas/actual-consumption/")(
  {
    validateSearch: actualConsumptionSearchSchema,
    component: RouteComponent,
  },
);

export default function RouteComponent() {
  return <ActualConsumption />;
}
