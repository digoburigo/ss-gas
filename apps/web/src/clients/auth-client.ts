import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

if (!import.meta.env.PUBLIC_SERVER_URL) {
	throw new Error("PUBLIC_SERVER_URL is not set");
}

export const authClient = createAuthClient({
	baseURL: import.meta.env.PUBLIC_SERVER_URL,
	plugins: [adminClient(), organizationClient()],
	fetchOptions: {
		credentials: "include",
	},
});

export type AuthSession =
	| ReturnType<typeof createAuthClient>["$Infer"]["Session"]
	| null;
