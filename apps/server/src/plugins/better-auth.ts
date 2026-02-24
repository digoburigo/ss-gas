// import { auth } from "@acme/auth";
import { initAuth } from "@acme/auth";
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
});

// user middleware (compute user and session and pass to routes)
export const betterAuth = new Elysia({ name: "better-auth" })
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
