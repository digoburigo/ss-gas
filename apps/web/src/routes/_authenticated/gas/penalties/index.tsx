import { createFileRoute } from "@tanstack/react-router";

import { Penalties } from "~/features/penalties";

export const Route = createFileRoute("/_authenticated/gas/penalties/")({
  component: RouteComponent,
});

export default function RouteComponent() {
  return <Penalties />;
}
