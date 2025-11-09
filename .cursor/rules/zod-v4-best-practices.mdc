---
description: 
globs: *.ts,*.tsx
alwaysApply: false
---
- Prefer importing from "zod/v4" (or the tree-shakable "zod/v4-mini") to unlock all v4 APIs and ensure bundlers eliminate unused code.
- Use `.overwrite()` for transforms that keep the original type. This preserves method-chaining and maintains schema introspection (e.g. `z.number().overwrite(n => n ** 2).max(100)`).
- Compose complex discriminated unions by nesting `z.discriminatedUnion()` schemas (e.g. embed an *error* union inside a *result* union). This keeps inference precise and validation exhaustive.
- Define fully type-safe, schema-validated functions with `z.function({ input: [...], output: ... }).implement(fn)`. Use this to guarantee contract safety between layers (controllers, services, etc.).
- Prefer top-level format helpers (`z.email()`, `z.uuidv4()`, `z.url()`, `z.ipv4()`, etc.) over chained `.string().email()` for conciseness and improved tree-shaking.
- Replace `z.object().strict()` / `.passthrough()` with `z.strictObject()` / `z.looseObject()` to adhere to the new v4 API and reduce bundle size.
- Always pass *both* key and value schemas to `z.record(keySchema, valueSchema)`. This enables exact-type inference and exhaustive runtime validation.
- Use `z.tuple([firstSchema], restSchema)` to represent non-empty arrays (e.g. `[string, ...string[]]`) instead of `.array().nonempty()`.
- Prefer numeric helpers like `z.int32()`, `z.uint64()`, `z.float32()` for fixed-width number constraints—guaranteeing proper min/max limits.
- For conditional or locale-aware error messages, provide the unified `error(issue)` callback when defining a schema (replaces `required_error` / `invalid_type_error`).
- Configure global locale once with `z.config(z.locales.<lang>())` (e.g. `z.config(z.locales.en())`) to keep error messaging consistent across the app.
- Add custom issues by mutating the `ZodError.issues` array directly to keep compatibility with error aggregation utilities.
- Chain object operations (`.extend()`, `.omit()`, etc.) freely; v4 resolves prior performance issues, enabling complex schema composition without compiler errors.
- Favor `z.transform()` for standalone transformations and functional composition over ad-hoc `map` utilities.
- When composing multiple validations/transforms on a schema, use `.check(...)` (available in `zod/v4-mini`) for cleaner intent and automatic method chaining.
- Leverage inferred types (`z.infer<typeof schema>`) everywhere instead of duplicating interfaces—this keeps TypeScript and runtime schemas in lock-step.
- Integrate Zod schemas directly with React Hook Form, TanStack Router loaders, and tRPC procedures to centralize validation logic and avoid duplication.
- Treat schemas as the single source of truth: derive mock generators, OpenAPI docs, and validation middlewares from them to eliminate drift.
- Enforce exhaustive discriminated unions by enabling TypeScript's `--strictNullChecks` and never using `as` casts when narrowing parsed data.
- Document domain-level schemas (DTOs, API payloads) in `/src/lib/schemas` and co-locate feature-specific schemas with their modules for maintainability.
