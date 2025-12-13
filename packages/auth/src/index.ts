import { expo } from "@better-auth/expo";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
// import { zenstackAdapter } from "@zenstackhq/better-auth";
import { betterAuth } from "better-auth";
import { oAuthProxy } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { organization } from "better-auth/plugins/organization";
import { Pool } from "pg";
import { v7 as uuidv7 } from "uuid";

// import { db } from "@acme/zen-v3";

export function initAuth<
	TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
	baseUrl: string;
	productionUrl: string;
	secret: string | undefined;

	discordClientId: string;
	discordClientSecret: string;
	extraPlugins?: TExtraPlugins;
}) {
	const config = {
		// database: zenstackAdapter(db, {
		//   provider: "postgresql",
		// }),
		database: new Pool({
			connectionString: process.env.DATABASE_URL,
		}),
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // Cache duration in seconds
			},
		},
		baseURL: options.baseUrl,
		secret: options.secret,
		advanced: {
			database: {
				generateId: () => uuidv7(),
			},
		},
		plugins: [
			oAuthProxy({
				productionURL: options.productionUrl,
				currentURL: "expo://", // Must differ from productionURL for oAuthProxy to activate
			}),
			expo(),
			admin(),
			organization(),
			...(options.extraPlugins ?? []),
		],
		emailAndPassword: {
			enabled: true,
		},
		socialProviders: {
			discord: {
				clientId: options.discordClientId,
				clientSecret: options.discordClientSecret,
				redirectURI: `${options.productionUrl}/api/auth/callback/discord`,
			},
		},
		trustedOrigins: [
			"expo://",
			"exp://",
			"https://*.exp.direct",
			"http://localhost:*",
			process.env.PUBLIC_WEB_URL ?? "",
		],
		onAPIError: {
			onError(error, ctx) {
				console.error("BETTER AUTH API ERROR", error, ctx);
			},
		},
	} satisfies BetterAuthOptions;

	return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
