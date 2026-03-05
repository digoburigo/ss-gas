import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gas/entry")({
  beforeLoad: () => {
    throw redirect({ to: "/gas/scheduling-dashboard" });
  },
  component: () => null,
});
