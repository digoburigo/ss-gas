// import { RestApiHandler } from "@zenstackhq/server/api";

import { authDb } from "@acme/zen-v3";
import { schema } from "@acme/zen-v3/zenstack/schema";
import { RPCApiHandler } from "@zenstackhq/server/api";
import { createElysiaHandler } from "@zenstackhq/server/elysia";
import { Elysia } from "elysia";

import { auth, betterAuth } from "../../plugins/better-auth";

export async function getSessionUser({ request }: { request: Request }) {
	const sessionResult = await auth.api.getSession({
		headers: request.headers,
	});
	if (!sessionResult) {
		return null;
	}

	const { session, user } = sessionResult;

	let organizationRole: string | null = null;

	if (session.activeOrganizationId) {
		const { role } = await auth.api.getActiveMemberRole({
			// This endpoint requires session cookies.
			headers: request.headers,
		});
		organizationRole = role;
	}

	return {
		userId: user.id,
		organizationId: session.activeOrganizationId,
		organizationRole,
		role: user.role,
	};
}

export const zenstackController = new Elysia()
	.use(betterAuth)
	.group("/model", (app) =>
		app.use(
			createElysiaHandler({
				apiHandler: new RPCApiHandler({
					schema,
				}),
				basePath: "/api/model",
				// getSessionUser extracts the current session user from the request,
				// its implementation depends on your auth solution
				getClient: async (context: any) => {
					const user = await getSessionUser({
						request: context.request,
					});

					if (!user) {
						return authDb.$setAuth(undefined);
					}

					return authDb.$setAuth(user as any);
				},
			}),
		),
	);
