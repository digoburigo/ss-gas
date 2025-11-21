---
description: Best practices for using Shadcn UI components
globs: *.ts,*.tsx
alwaysApply: false
---

- For UI/UX design, always look up for guids in https://www.components.build/ using context7 mcp.
- Use Shadcn UI components as building blocks for your UI
- Customize components using the provided props and className
- Implement dark mode support using the built-in dark mode classes
- Ensure accessibility by following the component's accessibility guidelines
- Use the provided TypeScript types for type-safe component usage
- Install components with the CLI: npx shadcn@latest add <component>; it respects paths defined in components.json.
- Maintain components.json (style preset, TSX flag, Tailwind CSS file path, aliases, Lucide icons).
- Drive theming with OKLCH CSS variables: define :root values, override in .dark, and map to --color-\* tokens inside @theme inline.
- Derive radius sizes (sm/md/lg/xl) from a single --radius token.
- Import tailwindcss and tw-animate-css; create a custom dark variant: @custom-variant dark (&:is(.dark )).
- Centralize base styles in @layer base: \* { @apply border-border outline-ring/50 } and body { @apply bg-background text-foreground }.
- Wrap context-dependent components (e.g., SidebarTrigger) within their providers (e.g., <SidebarProvider>).
- Use compound component patterns (Popover, HoverCard, Accordion, ContextMenu) with Trigger + Content pairs for accessibility.
- Position floating UIs with @floating-ui/react’s useFloating.
- Combine Tailwind utility best practices (group, data-[disabled], etc.) with Shadcn components.
- Keep design tokens (colors, radius) only in CSS custom properties—no hard-coded values.
- Create new components in the components with colors from the palette defined in src/styles/app.css. Never use hard-coded colors.
