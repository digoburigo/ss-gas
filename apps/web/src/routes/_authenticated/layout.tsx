import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "~/clients/auth-client";
import { AuthenticatedLayout } from "~/components/layout/authenticated-layout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.session) {
      throw redirect({ to: "/auth/login" });
    }

    // If no active organization is selected
    if (!session.session.activeOrganizationId) {
      const { data: organizations } = await authClient.organization.list();

      // If user has no organizations or more than 1, redirect to organizations page
      if (!organizations || organizations.length !== 1) {
        throw redirect({ to: "/organizations" });
      }

      // If user has exactly 1 organization, set it as active
      if (organizations.length === 1) {
        await authClient.organization.setActive({
          organizationId: organizations[0]!.id,
        });
        // We don't need to redirect here as we're already going to the intended destination
        // But we might want to reload to ensure all context is updated if needed,
        // though usually setting active org is enough if the app reacts to it.
        // For now, let's just proceed.
      }
    }
  },
  component: AuthenticatedLayout,
});
