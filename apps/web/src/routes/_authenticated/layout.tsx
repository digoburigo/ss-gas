import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "~/clients/auth-client";
import { AuthenticatedLayout } from "~/components/layout/authenticated-layout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.session) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: AuthenticatedLayout,
});
