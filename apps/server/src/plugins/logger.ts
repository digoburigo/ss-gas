import { logger } from "@bogeychan/elysia-logger";
import { createPinoLogger } from "@bogeychan/elysia-logger";

const isDev = process.env.NODE_ENV !== "production";

const pinoOptions = {
	level: process.env.LOG_LEVEL ?? "info",
	...(isDev
		? {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname",
					},
				},
			}
		: {}),
};

/**
 * Standalone pino logger for use in services outside of routes.
 */
export const log = createPinoLogger(pinoOptions);

/**
 * Elysia plugin that auto-logs requests/responses and provides ctx.log in handlers.
 * Ignores /api/healthcheck to reduce noise.
 */
export const loggerPlugin = logger({
	...pinoOptions,
	autoLogging: {
		ignore(req) {
			return new URL(req.url).pathname === "/api/healthcheck";
		},
	},
});
