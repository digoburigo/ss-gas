import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { Products } from "~/features/products";

const productsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  category: z.array(z.string()).optional().catch([]),
  active: z
    .array(z.enum(["active", "inactive"]))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/products/")({
  validateSearch: productsSearchSchema,
  component: RouteComponent,
});

export default function RouteComponent() {
  return <Products />;
}
