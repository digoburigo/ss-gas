import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";

import { authClient } from "~/clients/auth-client";
import { Organizations } from "~/features/organizations";

const organizationsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(["active", "inactive"]))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/admin/organizations/")({
  validateSearch: organizationsSearchSchema,
  beforeLoad: async () => {
    // Check if user is a global admin
    const session = await authClient.getSession();
    if (!session.data?.user || session.data.user.role !== "admin") {
      throw redirect({
        to: "/",
      });
    }
  },
  component: RouteComponent,
});

export default function RouteComponent() {
  return <Organizations />;
}
