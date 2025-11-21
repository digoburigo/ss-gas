---
description: Best practices for NextJS applications and routing
globs: *.ts,*.tsx
alwaysApply: false
---
# TanStack Router

## 1. General Setup
- Always import from `@tanstack/react-router`.
- Export every route definition as `Route` so that `tsr generate/watch` can discover the route tree.

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/example')({
  // ...
})
```

## 2. Creating Routes
1. **Prefer `createFileRoute`**  
   Enables file-based routing and automatic type-generation.
2. **Parent/Child Relations**  
   Use `getParentRoute` (for `createRoute`) or folder nesting (for `createFileRoute`) to model hierarchy.
3. **Property Order Matters**  
   Put `beforeLoad` first, then `loader`, then `component`.
   ```tsx
   export const Route = createFileRoute('/foo/$id')({
     beforeLoad: ({ context }) => ({ auth: context.auth }),
     loader: async ({ context }) => await fetchPost(context.auth),
     component: FooComponent,
   })
   ```

## 3. Data Loading
- **Loader Return Type** must be serialisable (dehydration).  
- **Abort Support**: respect `abortController.signal` in any network request.
  ```tsx
  loader: ({ abortController }) =>
    fetch('/api/posts', { signal: abortController.signal })
  ```
- **Deferred Data**: wrap long-running promises with `defer` and consume with `Await` or `useAwaited`.
- **Not Found**: throw `notFound()` to render `notFoundComponent`, or include `{ routeId: rootRouteId }` to fail the whole page.

## 4. Mutations & Invalidation
- After a successful mutation call `router.invalidate()` (optionally with a `filter`) to re-run loaders.
- For optimistic UI, serve existing data until loaders complete.

## 5. Navigation
- Use `Link` for declarative navigation.
- For router-wide hooks (e.g., `useNavigate`) pass `{ from: Route.fullPath }` for type-safety.
- To preserve search params, supply the `search` prop to `<Link>` or pass `navigate({ search })`.

## 6. Authentication Guards
- Protect routes with `beforeLoad` and `redirect` on auth failure.
  ```tsx
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  }
  ```

## 7. Query Client Integration (SSR)
- Instantiate a fresh `QueryClient` inside `createRouter`.
- Provide `dehydrate` / `hydrate` for SSR.
- Wrap the router with `QueryClientProvider` using `Wrap`.

## 8. 404 Handling
- Supply `notFoundComponent` on your root route to catch unmatched URLs.

## 9. Type-Safe Links
- Derive narrowed `LinkProps` arrays with `as const satisfies ReadonlyArray` for compile-time safety and faster TS performance.

## 10. Linting & CI
- Enable `@tanstack/router/create-route-property-order` ESLint rule.
- Add tests to ensure each route’s loader returns expected data and handles `notFound` states.

## 11. Performance & Security
- Cancel requests via `AbortController`.
- Validate all external data (e.g., Zod in `createServerFn` endpoints).
- Avoid exposing sensitive context in client bundles.

Follow these rules whenever you add or modify routing logic in the project.