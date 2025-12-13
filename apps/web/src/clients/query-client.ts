import { QueryClient } from "@tanstack/react-query";
import type { FetchFn } from "@zenstackhq/tanstack-query/react";

// custom fetch function that adds a custom header
export const myFetch: FetchFn = (url, options) => {
	options = {
		credentials: "include",
		...options,
	};
	options.headers = {
		...options.headers,
	};
	return fetch(url, options);
};

export const queryClient = new QueryClient();
