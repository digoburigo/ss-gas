import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { ContractAlerts } from "~/features/contract-alerts";

const contractAlertsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(["active", "inactive"]))
    .optional()
    .catch([]),
  type: z
    .array(
      z.enum([
        "contract_expiration",
        "renewal_deadline",
        "daily_scheduling",
        "monthly_declaration",
        "adjustment_date",
        "take_or_pay_expiration",
        "make_up_gas_expiration",
        "custom",
      ]),
    )
    .optional()
    .catch([]),
  filter: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/gas/contract-alerts/")({
  validateSearch: contractAlertsSearchSchema,
  component: RouteComponent,
});

export default function RouteComponent() {
  return <ContractAlerts />;
}
