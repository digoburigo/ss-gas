// import { useQuery } from "@tanstack/react-query";
// import { useClientQueries } from "@zenstackhq/tanstack-query/react";

// import { schema } from "@acme/zen-v3/zenstack/schema";

import { useTRPC } from "~/lib/trpc";

export function Test() {
	// const trpc = useTRPC();
	// const { data } = useQuery(trpc.);

	// const client = useClientQueries(schema);
	// const { data, error } = client.post.useFindMany();
	// console.log("🚀 -> data:", data);
	// console.log(`🚀 -> error:`, error);
	// if (error) {
	//   return <div>Error: {error.message}</div>;
	// }
	return <div>TestClient</div>;
}
