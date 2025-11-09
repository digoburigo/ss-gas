---
description: TypeScript coding standards and type safety guidelines
globs: *.ts,*.tsx
alwaysApply: false
---
- Enable TypeScript strict mode in tsconfig.json to enhance type safety and catch potential errors early.
- Prefer types over interfaces for defining object shapes.
- Implement comprehensive error handling using type guards and specific error types.
- Use advanced TypeScript features like conditional and mapped types for complex scenarios.
- Leverage module resolution and path aliases for improved project maintainability.
- Implement generics for reusable components and functions.
- Utilize type guards and assertions for runtime type checking.
- Turn on strict flags (e.g., noImplicitAny) and add explicit types instead of any.
- Use compiler option "verbatimModuleSyntax": true; prefer import type for type-only imports.
- JSX: wrap elements with a single root and keep React (or jsxImportSource) in scope; set jsx to react-jsx.
- In Node 16+/Next module resolution, import ESM with explicit .mjs etc.; CJS must use dynamic import().
- Classes implement interfaces (don’t extend them).
- Model data with unions/discriminated unions and narrow via switch.
- Create typed event emitters: interface maps event → tuple args; overload on for safety.
- Use satisfies to check object literals without widening literals.
- Adopt Symbol.dispose / using for deterministic disposal in ES2022+.
- Guard optional funcs with &&= or optional chaining—but don’t call when undefined.
- Keep module systems consistent and use explicit file extensions in ESM.
- Supply generic type args (e.g., useState<boolean>(false)) when inference is unclear.
- Always prefer imports with the "paths" options if configured in tsconfig.json
  - Example:
  "Good": `import { x } from "@/components...";
  "Bad": `import { x } from "../../components..."