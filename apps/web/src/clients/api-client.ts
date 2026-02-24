import { treaty } from "@elysiajs/eden";

import type { App } from "@acme/server";

if (!import.meta.env.PUBLIC_SERVER_URL) {
  throw new Error("PUBLIC_SERVER_URL is not set");
}

const webUrl = new URL(import.meta.env.PUBLIC_SERVER_URL);
const hostWithPort =
  webUrl.port && webUrl.port !== "80" && webUrl.port !== "443"
    ? `${webUrl.hostname}:${webUrl.port}`
    : webUrl.hostname;

export const api = treaty<App>(hostWithPort, {
  fetch: { credentials: "include" },
}).api;
