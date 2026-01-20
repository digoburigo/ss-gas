import { Elysia } from "elysia";

import { betterAuth } from "../../plugins/better-auth";

export const gasController = new Elysia({ prefix: "/gas" })
	.use(betterAuth)
	.get("/", () => ({ message: "Gas module" }));
