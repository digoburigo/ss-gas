import * as z from "zod";

export const CLIENT_ENV_PREFIX = "PUBLIC_";

export const envSchema = z.object({
	/**
	 * This is the backend API server. Note that this should be passed as
	 * a build-time variable (ARG) in docker.
	 */
	PUBLIC_SERVER_URL: z.pipe(z.string(), z.url()),
	PUBLIC_SERVER_API_PATH: z
		.custom<`/${string}`>(
			(input: any) => typeof input === "string" && input.startsWith("/"),
			'API Path must start with "/" if provided.',
		)
		.optional()
		.default("/api"),

	/**
	 * Set this if you want to run or deploy your app at a base URL. This is
	 * usually required for deploying a repository to Github/Gitlab pages.
	 */
	PUBLIC_BASE_PATH: z
		.string()
		.optional()
		.default("/")
		.refine((val) => val.startsWith("/"), {
			message: 'Base path must start with "/"',
		}),
});

export const env = z.parse(envSchema, import.meta.env);
