import { db } from "@acme/zen-v3";
import { cors } from "@elysiajs/cors";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";
import { sql } from "kysely";

import { contractExtractionController } from "./modules/contract-extraction";
import { gasController } from "./modules/gas";
import { userController } from "./modules/user";
import { zenstackController } from "./modules/zenstack";
import { betterAuth } from "./plugins/better-auth";
import { betterUpload } from "./plugins/better-upload";
import { scheduledJobs } from "./plugins/scheduled-jobs";

const trustedOrigins = [
	process.env.PUBLIC_WEB_URL ?? "http://localhost:3001",
].map((url) => new URL(url).origin);

export const app = new Elysia({
	prefix: "/api",
})
	.use(
		openapi({
			references: fromTypes(),
		}),
	)
	// .onError(({ error, code }) => {
	//   console.log(`🚀 -> code:`, code)
	//   console.log(`🚀 -> error:`, error)
	//   if (code === 'VALIDATION') {
	//     return error.detail(error.message);
	//   }

	//   return error
	// })
	.use(
		cors({
			origin: trustedOrigins,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	)
	.use(betterAuth)
	.use(betterUpload)
	.use(scheduledJobs)
	.use(zenstackController)
	.use(gasController)
	.use(userController)
	.use(contractExtractionController)
	.get("/", () => ({ message: "Hello Elysia!" }))
	.get("/healthcheck", () => ({ qualquercoisa: "OK 1" }), {
		response: {
			200: t.Object({
				qualquercoisa: t.String(),
			}),
		},
	})
	.get(
		"/test",
		async () => {
			const data = await db.$qb
				.selectFrom("Todo")
				.select((eb) => [
					sql<Date>`${eb.ref("Todo.updatedAt")}`.as("updatedAt"),
				])
				.execute();

			return data;
		},
		{
			response: {
				200: t.Array(
					t.Object({
						updatedAt: t.Date(),
					}),
				),
			},
		},
	)
	.get(
		"/error",
		({ status }) => {
			const random = Math.random();
			if (random < 0.5) {
				return status(404, { message: "Not Found" });
			}

			return { prop: "value" };
		},
		{
			response: {
				404: t.Object({
					message: t.String(),
				}),
			},
		},
	);

export default app;

if (!process.env.VERCEL) {
	app.listen({ hostname: "0.0.0.0", port: 3000 }, ({ hostname, port }) => {
		console.log(`🦊 Elysia is running at ${hostname}:${port}`);
	});
}

export type App = typeof app;
