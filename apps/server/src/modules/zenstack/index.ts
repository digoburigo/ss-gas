// import { RestApiHandler } from "@zenstackhq/server/api";

import { authDb } from "@acme/zen-v3";
import { schema } from "@acme/zen-v3/zenstack/schema";
import { RPCApiHandler } from "@zenstackhq/server/api";
import { createElysiaHandler } from "@zenstackhq/server/elysia";
import { Elysia } from "elysia";

import { auth, betterAuth } from "../../plugins/better-auth";
import { AuditService } from "../../services";

// Map ZenStack model names to audit entity types
const modelToEntityType: Record<string, string> = {
	gasContract: "contract",
	gasUnit: "unit",
	gasDailyPlan: "plan",
	gasDailyEntry: "consumption",
	gasRealConsumption: "consumption",
	gasEquipment: "parameter",
	gasEquipmentConstant: "parameter",
	gasSystemParameter: "parameter",
	gasContractTemplate: "template",
	gasCustomField: "custom_field",
	gasContractAlert: "alert",
	gasUnitContract: "contract",
};

// Mutations that should be audited
const auditedOperations = new Set(["create", "update", "delete", "createMany", "updateMany", "deleteMany", "upsert"]);

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
		userRole: user.role,
	};
}

export const zenstackController = new Elysia()
	.use(betterAuth)
	.onAfterHandle(async ({ request, response }) => {
		// Only audit POST requests (ZenStack RPC uses POST for all operations)
		if (request.method !== "POST") return;

		try {
			const url = new URL(request.url);
			const pathParts = url.pathname.split("/").filter(Boolean);

			// Expected path: /api/model/{modelName}/{operation}
			const modelIdx = pathParts.indexOf("model");
			if (modelIdx === -1 || modelIdx + 2 >= pathParts.length) return;

			const modelName = pathParts[modelIdx + 1] as string | undefined;
			const operation = pathParts[modelIdx + 2] as string | undefined;

			// Only audit write operations on tracked models
			if (!modelName || !operation || !auditedOperations.has(operation)) return;
			const entityType = modelToEntityType[modelName];
			if (!entityType) return;

			// Check response was successful (2xx)
			if (response instanceof Response && !response.ok) return;

			// Get user info for audit context
			const sessionUser = await getSessionUser({ request });

			// Determine audit action
			let action: "create" | "update" | "delete" = "create";
			if (operation.startsWith("update") || operation === "upsert") {
				action = "update";
			} else if (operation.startsWith("delete")) {
				action = "delete";
			}

			// Extract entity info from response if possible
			let entityId = "unknown";
			let entityName: string | undefined;
			try {
				if (response instanceof Response) {
					const cloned = response.clone();
					const body = (await cloned.json()) as Record<string, Record<string, string> | undefined>;
					const data = body?.data;
					if (data?.id) entityId = data.id;
					if (data?.name) entityName = data.name;
					else if (data?.code) entityName = data.code;
				}
			} catch {
				// Response parsing is best-effort
			}

			AuditService.log({
				entityType,
				entityId,
				entityName,
				action,
				userId: sessionUser?.userId ?? undefined,
				organizationId: sessionUser?.organizationId ?? undefined,
			});
		} catch (error) {
			console.error("[ZenStack Audit] Failed to log operation:", error);
		}
	})
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
