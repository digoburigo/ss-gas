import type { NextRequest } from "next/server";
import { RPCApiHandler } from "@zenstackhq/server/api";
import { NextRequestHandler } from "@zenstackhq/server/next";

import { authDb } from "@acme/zen-v3";
import { schema } from "@acme/zen-v3/zenstack/schema";

function getAuth(req: NextRequest) {
  return {
    userId: "1",
    organizationId: "2",
    organizationRole: "admin",
  };
}

const handler = NextRequestHandler({
  apiHandler: new RPCApiHandler({ schema }),
  // getSessionUser extracts the current session user from the request, its
  // implementation depends on your auth solution
  getClient: (req: NextRequest) => authDb.$setAuth(getAuth(req) as any),
  useAppDir: true,
});

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
