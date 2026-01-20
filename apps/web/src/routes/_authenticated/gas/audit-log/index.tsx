import { createFileRoute } from "@tanstack/react-router";

import { AuditLog } from "~/features/audit-log";

export const Route = createFileRoute("/_authenticated/gas/audit-log/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AuditLog />;
}
