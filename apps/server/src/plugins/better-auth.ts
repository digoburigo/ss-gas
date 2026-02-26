// import { auth } from "@acme/auth";
import { initAuth } from "@acme/auth";
import { db } from "@acme/zen-v3";
import { Elysia } from "elysia";

if (!process.env.AUTH_SECRET) {
	throw new Error("AUTH_SECRET is not set");
}

let baseUrl = "http://localhost:3000";
if (process.env.BASE_URL) {
	baseUrl = process.env.BASE_URL;
} else if (process.env.VERCEL_ENV === "production") {
	baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
} else if (process.env.VERCEL_ENV === "preview") {
	baseUrl = `https://${process.env.VERCEL_URL}`;
}
console.log(`🚀 -> baseUrl:`, baseUrl);

let productionUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "turbo.t3.gg"}`;
if (process.env.BASE_URL) {
	productionUrl = process.env.BASE_URL;
}

export const auth = initAuth({
	baseUrl,
	productionUrl,
	secret: process.env.AUTH_SECRET,
	discordClientId: process.env.AUTH_DISCORD_ID!,
	discordClientSecret: process.env.AUTH_DISCORD_SECRET!,
	// extraPlugins: [nextCookies()],
	databaseHooks: {
		session: {
			create: {
				async after(session) {
					// Log login event when a new session is created
					if (!session?.userId) return;
					try {
						const user = await db.user.findUnique({
							where: { id: session.userId },
						});
						if (!user) return;

						// Find user's active organization for audit context
						const member = await db.member.findFirst({
							where: { userId: session.userId },
						});

						await db.gasAuditLog.create({
							data: {
								entityType: "session",
								entityId: session.id,
								entityName: user.name ?? "Unknown",
								action: "login",
								userId: session.userId,
								userName: user.name ?? "Unknown",
								userEmail: user.email ?? "",
								organizationId: member?.organizationId ?? null,
								metadata: JSON.stringify({
									ipAddress: session.ipAddress ?? null,
									userAgent: session.userAgent ?? null,
								}),
							},
						});
					} catch (error) {
						console.error("[AuditHook] Failed to log login event:", error);
					}
				},
			},
		},
	},
});

// user middleware (compute user and session and pass to routes)
export const betterAuth = new Elysia({ name: "better-auth" })
	.onBeforeHandle(async ({ request }) => {
		// Intercept sign-out requests to log logout events before the session is destroyed
		const url = new URL(request.url);
		if (request.method === "POST" && url.pathname.endsWith("/sign-out")) {
			try {
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (session?.user) {
					await db.gasAuditLog.create({
						data: {
							entityType: "session",
							entityId: session.session.id,
							entityName: session.user.name ?? "Unknown",
							action: "logout",
							userId: session.user.id,
							userName: session.user.name ?? "Unknown",
							userEmail: session.user.email ?? "",
							organizationId: session.session.activeOrganizationId ?? null,
						},
					});
				}
			} catch (error) {
				console.error("[AuditHook] Failed to log logout event:", error);
			}
		}
	})
	.mount(auth.handler)
	.macro({
		auth: {
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({
					headers,
				});
				console.log(`🚀 -> session:`, session);

				if (!session) {
					return status(401);
				}

				let organizationRole: string | null = null;
				if (session.session.activeOrganizationId) {
					const { role } = await auth.api.getActiveMemberRole({
						// This endpoint requires session cookies.
						headers,
					});
					organizationRole = role;
				}

				return {
					user: session.user,
					session: session.session,
					organizationRole,
				};
			},
		},
	});
