import { createFileRoute } from "@tanstack/react-router";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { TodoCreate } from "~/components/todos/todo-create";
import { TodoList } from "~/components/todos/todo-list";

export const Route = createFileRoute("/(app)/todos")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: activeOrganization, isPending: isLoadingActiveOrganization } =
    authClient.useActiveOrganization();

  const client = useClientQueries(schema);

  const { data: todos, isFetching: isFetchingTodos } = client.todo.useFindMany(
    {},
    {
      enabled: !!activeOrganization?.id,
    },
  );

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Todos</h1>
        <p className="text-muted-foreground">Manage your tasks and todos.</p>
      </div>

      {isLoadingActiveOrganization ? (
        <p>Loading active organization...</p>
      ) : null}
      {!isLoadingActiveOrganization && !activeOrganization ? (
        <p>Please select an organization to view todos.</p>
      ) : null}

      {activeOrganization && (
        <>
          <TodoCreate />

          {isFetchingTodos ? <p>Loading todos...</p> : null}
          {!isFetchingTodos && todos && todos?.length === 0 ? (
            <p>No todos found</p>
          ) : null}
          {!isFetchingTodos && todos && todos.length > 0 ? (
            <TodoList todos={todos} />
          ) : null}
        </>
      )}
    </div>
  );
}

