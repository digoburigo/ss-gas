---
description: Best practices for using tRPC for remote procedure calls
globs: *.ts,*.tsx
alwaysApply: false
---
- Structure routers and procedures logically, grouping by data entity and operation type.
- Use Zod for input validation to ensure type safety across client-server interactions.
- Implement global error handlers and custom middleware for robust error management.
- Integrate tRPC effectively with React Query for managing queries, mutations, and subscriptions.
- Optimize performance through SSR/SSG, request batching, caching, and dynamic imports.
- Use the version 11
- Define your router structure carefully to reflect your application's API.
- Implement proper error handling and logging for tRPC procedures.
- Utilize tRPC's built-in support for React Query for seamless integration.
- Define a single AppRouter with router({ … }) combining queries and mutations (use publicProcedure by default).
- Validate inputs with Zod using .input(); prefer .safeParse for custom error handling.
- Create protectedProcedure middleware to enforce auth (throw TRPCError({ code: 'UNAUTHORIZED' }) when ctx.user is absent) and reuse it for secured routes.
- Extend context via middleware .pipe() to add typed properties; ensure non-null ctx.user in protected contexts.
- Leverage built-in TanStack React Query integration; invalidate queries after mutations with queryClient.invalidateQueries().
- Batch HTTP calls with httpBatchLink and enable request logging in development.
- Share Zod schemas between client and server for end-to-end type safety.
- Unit-test routers with appRouter.createCaller(ctx) to call procedures directly.