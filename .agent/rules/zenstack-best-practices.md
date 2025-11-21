---
description: Best practices for using ZenStack in your application
globs: *.zmodel
alwaysApply: false
---
- Use ZenStack's access policy system to implement fine-grained authorization.
- Regularly run `zenstack generate` to keep your Prisma schema and ZenStack models in sync.
- Utilize ZenStack's query API for efficient data fetching with built-in authorization.
- Implement custom plugins to extend ZenStack's functionality when needed.
- Declare access control with @@allow / @@deny; deny rules override allow rules.
- Always query through an enhanced PrismaClient: enhance(prisma, { user: ctxUser }); never use the bare prisma instance in request-scope code.
- Run npx zenstack generate after every ZModel change to regenerate Prisma schema, client extensions, and typed React hooks.
- Pass full user context (userId, organizationId, organizationRole) to enhance() so auth() works correctly.
- Keep @zenstackhq/runtime and @zenstackhq/cli versions aligned; install runtime as a regular dependency.
- Use the tRPC plugin to autogenerate routers instead of hand-written endpoints when possible.
- For anonymous access, call enhance(prisma) with no user context.
- Extend functionality with custom ZenStack plugins when needed.
- Test policies using separate enhanced clients for different users to validate enforcement.