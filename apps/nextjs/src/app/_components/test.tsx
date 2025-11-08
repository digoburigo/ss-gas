"use client";

import { useClientQueries } from "@zenstackhq/tanstack-query/react";

import { schema } from "@acme/zen-v3/zenstack/schema";

export function Test() {
  const client = useClientQueries(schema);
  const { data, error } = client.post.useFindMany();
  console.log("🚀 -> data:", data);
  console.log(`🚀 -> error:`, error);
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return <div>TestClient</div>;
}
