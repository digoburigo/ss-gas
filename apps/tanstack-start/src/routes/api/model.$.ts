import { createFileRoute } from "@tanstack/react-router";
import { RPCApiHandler } from "@zenstackhq/server/api";
import { TanStackStartHandler } from "@zenstackhq/server/tanstack-start";

import { authDb } from "@acme/zen-v3";
import { schema } from "@acme/zen-v3/zenstack/schema";

function getAuth(request: any) {
  return {
    userId: "123",
    organizationId: "123",
    organizationRole: "admin",
  };
}

const handler = TanStackStartHandler({
  apiHandler: new RPCApiHandler({ schema }),
  // getSessionUser extracts the current session user from the request, its
  // implementation depends on your auth solution
  getClient: (request) => authDb.$setAuth(getAuth(request) as any),
});

export const Route = createFileRoute("/api/model/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
    },
  },
});
