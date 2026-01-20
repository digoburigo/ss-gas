import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { Contracts } from "~/features/contracts";

const contractsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(["active", "inactive"]))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/gas/contracts/")({
  validateSearch: contractsSearchSchema,
  component: RouteComponent,
});

export default function RouteComponent() {
  return <Contracts />;
}
