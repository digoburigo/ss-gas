---
description: Best practices for React development
globs: *.tsx
alwaysApply: false
---

- When using react, always look up for guids in https://react.dev/ using context7 mcp.
- Use functional components, with `function` keyword and hooks over class components for better readability and reusability.
- Implement React.memo and useMemo for performance optimization where necessary.
- Adhere strictly to React hooks rules to prevent common errors.
- Utilize React.lazy and Suspense for code-splitting and lazy loading of components.
- Implement error boundaries to manage and display errors effectively.
- Be aware that this is a Tanstack Start project and utilize React in the best way within the meta framework.
- Implement proper prop type validation using TypeScript.
- Use context API or state management libraries for global state management.
- useState holds local state; updates are batched and based on the render-time snapshot.
- Memoize handlers/objects with useCallback/useMemo and wrap children in React.memo to avoid extra renders.
- Keep all reactive values in useEffect deps; move constants outside or use useEffectEvent to trim deps safely.
- Give each list item a stable key (e.g., id).
- Centralize complex state with useReducer + Context to eliminate prop drilling.
- Use controlled form inputs; restrict secrets to the server with "server-only".
- Add explicit type parameters to useState when inference isn’t enough.
- Show pending UI with useFormStatus in RSC forms.
- Provide cleanup in useEffect to disconnect subscriptions.
- Understand setState batching: multiple calls in one handler yield a single update.
- Move stable constants outside component to keep effects from re-running.
- Follow render-prop patterns with unique keys and pass index when needed.
