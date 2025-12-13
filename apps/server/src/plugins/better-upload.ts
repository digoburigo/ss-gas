import type { Router } from "@better-upload/server";
import { handleRequest, route } from "@better-upload/server";
import { cloudflare } from "@better-upload/server/clients";
import { Elysia } from "elysia";

import { getSessionUser } from "../modules/zenstack";
import { betterAuth } from "./better-auth";

const router: Router = {
	client: cloudflare({
		accountId: process.env.R2_ACCOUNT_ID!,
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	}),
	bucketName: "zen",
	routes: {
		images: route({
			fileTypes: ["image/*"],
			multipleFiles: true,
			maxFiles: 4,
			onBeforeUpload: async ({ req, files, clientMetadata }) => {
				const session = await getSessionUser({ request: req });
				return {
					generateObjectInfo: ({ file }) => ({
						key: `${session?.organizationId ?? ""}/files/${file.name}`,
						metadata: {
							userId: session?.userId ?? "",
							organizationId: session?.organizationId ?? "",
						},
					}),
				};
			},
		}),
	},
};

export const betterUpload = new Elysia({ name: "better-upload" })
	.use(betterAuth)
	.post(
		"/upload",
		({ request, user, status }) => {
			console.log(`🚀 -> user:`, user);
			console.log(`🚀 -> request:`, request);
			if (!user) {
				return status(401, { message: "Unauthorized" });
			}

			return handleRequest(request, router);
		},
		{
			auth: true,
		},
	);
