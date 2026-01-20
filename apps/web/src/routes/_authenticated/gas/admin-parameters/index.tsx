import { createFileRoute } from "@tanstack/react-router";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { AdminParameters } from "~/features/admin-parameters";
import { ForbiddenError } from "~/features/errors/forbidden";

export const Route = createFileRoute("/_authenticated/gas/admin-parameters/")({
  component: AdminParametersPage,
});

function AdminParametersPage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const client = useClientQueries(schema);

  // Fetch current user's member record to check profile
  const { data: member, isLoading: isMemberLoading } = client.member.useFindFirst({
    where: {
      userId: session?.user?.id,
    },
    select: {
      profile: true,
      role: true,
    },
  }, {
    enabled: !!session?.user?.id,
  });

  // Loading state
  if (isSessionPending || isMemberLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Check if user has admin profile - Only Admin profile has access (per acceptance criteria)
  const isAdmin = member?.profile === "admin" || member?.role === "admin" || member?.role === "owner";

  // If not admin, show forbidden page
  if (!isAdmin) {
    return <ForbiddenError />;
  }

  return <AdminParameters />;
}
