import type { App } from "@acme/server";
import { treaty } from "@elysiajs/eden";

if (!import.meta.env.PUBLIC_SERVER_URL) {
	throw new Error("PUBLIC_SERVER_URL is not set");
}

const webUrl = new URL(import.meta.env.PUBLIC_SERVER_URL);

export const api = treaty<App>(`${webUrl.hostname}:${webUrl.port}`).api;
