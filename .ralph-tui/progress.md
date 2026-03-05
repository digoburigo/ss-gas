# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- Volume/number cells in data tables should use `text-sm font-mono truncate` for consistent sizing and overflow protection
- Use `minSize` on TanStack Table column defs to set minimum column widths
- For prominent display numbers (QDS/QDP), use `text-lg`/`text-xl font-bold font-mono truncate` instead of `text-2xl`/`text-3xl` to handle 6+ digit values
- Summary card values benefit from Tooltip wrappers to show full values when truncated
- Admin role check: query `member` model via `client.member.useFindFirst({ where: { userId }, select: { profile: true, role: true } })`, then check `profile === "admin" || role === "admin" || role === "owner"`
- react-day-picker v9: use `disabled={{ before: date }}` and `startMonth={date}` to restrict date selection/navigation
- AI SDK v6: use `maxOutputTokens` (not `maxTokens`), `usage.inputTokens`/`usage.outputTokens` (not `promptTokens`/`completionTokens`)
- Elysia context does not always include `log` — use the imported `log` from logger plugin or remove logging for simpler endpoints
- ExcelJS `workbook.xlsx.load()` needs `as any` cast with Node.js v24 due to Buffer type incompatibility

---

## 2026-03-05 - US-001
- Capped volume cell font size to `text-sm` in scheduling-dashboard-columns.tsx
- Added `truncate` class to prevent 6+ digit numbers from overflowing
- Set `minSize: 130` on the scheduledVolume column to accommodate formatted PT-BR numbers (e.g., '54.000,0')
- Preserved `toLocaleString('pt-BR')` formatting
- Files changed: `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-columns.tsx`
- **Learnings:**
  - Volume cell was using `font-mono` without any size constraint, inheriting default (potentially large) font size
  - Pre-existing typecheck errors in `@acme/eslint-config` and `@acme/ui` (csstype version mismatches) - not related to this change
---

## 2026-03-05 - US-002
- Replaced `text-3xl font-bold` with `text-xl font-bold font-mono truncate` for QDS and QDP display values
- Replaced `text-2xl font-bold` with `text-lg font-bold font-mono truncate` for Atomizador and Linhas values
- Files changed: `apps/web/src/components/gas/daily-entry-form.tsx`
- **Learnings:**
  - QDS/QDP section uses a 4-column grid (`sm:grid-cols-2 lg:grid-cols-4`) — smaller font sizes help values fit within grid cells
  - Same `font-mono truncate` pattern from US-001 applies here for overflow protection
---

## 2026-03-05 - US-003
- Changed 4 summary cards (QDC, QDS, QDP, QDR) from `text-2xl font-bold` to `text-lg font-bold font-mono truncate`
- Changed 2 tolerance indicator cards (Transport, Molecule) from `text-2xl font-bold` to `text-lg font-bold font-mono truncate`
- Added Tooltip wrappers to all 4 summary card values for full value display on hover
- Files changed: `apps/web/src/features/gas/index.tsx`
- **Learnings:**
  - Tooltip components were already imported in the file (used by tolerance cards), so no new imports needed
  - Pre-existing typecheck errors in `@acme/tailwind-config` and recharts ChartTooltipContent — not related to this change
---

## 2026-03-05 - US-004
- Added past-date blocking to the scheduling dashboard date picker for non-admin users
- Calendar `disabled: { before: today }` prevents selecting past dates
- Calendar `startMonth: today` prevents navigating to past months
- Previous day button is disabled when on today (for non-admin)
- Admin users (profile === "admin", role === "admin", or role === "owner") bypass all restrictions
- Uses same admin detection pattern as `admin-parameters/index.tsx`: query `member` model for `profile` and `role`
- Files changed: `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-date-picker.tsx`
- **Learnings:**
  - react-day-picker v9 uses `startMonth` prop (not `fromDate`/`fromMonth` which were v8 API)
  - react-day-picker v9 `disabled` prop accepts matcher objects like `{ before: Date }` to disable date ranges
  - Admin role check pattern: query `member` model with `useFindFirst` filtering by `userId`, selecting `profile` and `role`
  - Conditional spread `{...(!isAdmin && { disabled, startMonth })}` cleanly applies props only for non-admin users
- Generic DatePicker should have configurable `disabled` prop (type `Matcher | Matcher[]` from react-day-picker) — callers pass their own restrictions
---

## 2026-03-05 - US-005
- Made DatePicker's `disabled` prop configurable instead of hardcoded (accepts `Matcher | Matcher[]` from react-day-picker)
- Default behavior (no prop) does not restrict any dates
- Updated existing usages (daily-entry-form, account-form) to explicitly pass their date restrictions
- Files changed:
  - `apps/web/src/components/date-picker.tsx`
  - `apps/web/src/components/gas/daily-entry-form.tsx`
  - `apps/web/src/features/settings/account/account-form.tsx`
- **Learnings:**
  - react-day-picker exports a `Matcher` type that covers all valid disabled patterns (functions, date objects, ranges, etc.)
  - Using conditional spread `{...(disabled !== undefined && { disabled })}` avoids passing `undefined` to Calendar
---

## 2026-03-05 - US-006
- Added `min` attribute to the date `<input type="date">` for today (non-admin users)
- Added TanStack Form `onChange` validator that rejects past dates with error message "Não é permitido selecionar datas passadas."
- Admin users (profile === "admin", role === "admin", or role === "owner") bypass both restrictions
- Uses same admin detection pattern as US-004: query `member` model via `useFindFirst`
- Files changed: `apps/web/src/features/daily-scheduling/components/daily-scheduling-form.tsx`
- **Learnings:**
  - TanStack Form field-level validators use `validators: { onChange: ({ value }) => string | undefined }` — return error string or undefined
  - HTML `<input type="date">` supports `min` attribute with `YYYY-MM-DD` string to restrict date selection natively
  - Conditional spread `{...(!isAdmin && { min: today })}` cleanly applies the min attribute only for non-admin users
---

## 2026-03-05 - US-007
- Removed 'Lançamento Diário' entry from both sidebar data files (sidebar-data.ts and app-sidebar.tsx)
- Converted /gas/entry route to redirect to /gas/scheduling-dashboard using TanStack Router's `beforeLoad` + `redirect`
- Files changed:
  - `apps/web/src/components/layout/data/sidebar-data.ts`
  - `apps/web/src/components/app/app-sidebar.tsx`
  - `apps/web/src/routes/_authenticated/gas/entry.tsx`
- **Learnings:**
  - Project has two sidebar components: `layout/data/sidebar-data.ts` (used by command menu) and `app/app-sidebar.tsx` (actual sidebar) — both need updating
  - TanStack Router redirects: use `beforeLoad: () => { throw redirect({ to: "/target" }) }` in the route config
---

## 2026-03-05 - US-008
- Added `GET /gas/reports/latest-month` endpoint that queries the most recent `gasDailyEntry` date for the org
- Created `useLatestMonth` hook in the reports page to fetch the latest month with data
- Updated `DashboardTab` to use `latestMonth` as the end date for its date range (instead of `getCurrentMonth()`)
- Updated `PetrobrasReportTab` to default both `selectedMonth` and `comparisonMonth` to the latest month with data
- Added `getMonthNAgoFrom(reference, n)` helper to compute relative months from any reference (not just "now")
- Removed unused `getMonthNAgo` function
- Files changed:
  - `apps/server/src/modules/gas/gas.controller.ts`
  - `apps/web/src/routes/_authenticated/gas/reports.tsx`
- **Learnings:**
  - Reports page defaulted to `getCurrentMonth()` which returned the current calendar month — if no data existed for the current month, all reports were empty
  - The Petrobras tab has two separate month selectors: one for the main report data and one for the comparison chart
  - Using `useState<string | null>(null)` with an `effectiveValue = state ?? default` pattern allows lazy initialization from async data without causing re-render loops
  - The `useLatestMonth` hook uses `staleTime: 5 * 60 * 1000` to avoid redundant refetches across both tabs
---

## 2026-03-05 - US-010
- Replaced Save icon with Pencil for edit buttons in all 3 parameter tabs
- Replaced AlertTriangle icon with X for cancel buttons
- Kept Check icon for confirm/save action (was already correct)
- Added Tooltip wrappers to all action buttons: Editar, Salvar, Cancelar, Restaurar padrão
- Removed `title` attribute from reset buttons (replaced by Tooltip)
- Files changed:
  - `apps/web/src/features/admin-parameters/components/alert-thresholds-tab.tsx`
  - `apps/web/src/features/admin-parameters/components/penalty-formulas-tab.tsx`
  - `apps/web/src/features/admin-parameters/components/business-rules-tab.tsx`
- **Learnings:**
  - Tooltip component from `@acme/ui/tooltip` includes its own `TooltipProvider` so no need to wrap at a higher level
  - penalty-formulas-tab has edit buttons in two places (formula view and non-formula view) — both needed updating
  - business-rules-tab has a boolean toggle section with its own reset button that also needed a tooltip
---

## 2026-03-05 - US-011
- Created route at `/gas/monthly-scheduling` with authenticated layout
- Created feature folder at `apps/web/src/features/monthly-scheduling/`
- Added 'Programacao Mensal' to sidebar under Gas group (after Painel de Programacao)
- Page renders with title, description, and dashed placeholder content area
- Files changed:
  - `apps/web/src/routes/_authenticated/gas/monthly-scheduling/index.tsx`
  - `apps/web/src/features/monthly-scheduling/index.tsx`
  - `apps/web/src/components/layout/data/sidebar-data.ts`
- **Learnings:**
  - New route pattern: create route file with `createFileRoute`, feature index component with Header/Main layout
  - Sidebar has a single data file at `components/layout/data/sidebar-data.ts` (US-007 removed the duplicate in app-sidebar.tsx)
  - Pre-existing typecheck errors in `@acme/ui` (csstype version mismatches) are unrelated to feature work
---

## 2026-03-05 - US-012
- Added 3 server endpoints to gas.controller.ts:
  - `GET /gas/monthly-scheduling/template` - Downloads official Excel template with 4 columns (Data, Unidade, Volume Programado, Observacoes)
  - `POST /gas/monthly-scheduling/upload` - Parses Excel with ExcelJS, sends to AI (Claude Sonnet) for column mapping and unit name matching, returns interpreted rows with per-row validation errors
  - `POST /gas/monthly-scheduling/confirm` - Upserts GasDailyPlan records for confirmed valid rows
- Created upload drawer component reusing drag-and-drop pattern from contract-upload-drawer.tsx
- Integrated upload drawer into monthly scheduling page with "Upload Planilha" button
- Files changed:
  - `apps/server/src/modules/gas/gas.controller.ts` (3 new endpoints + AI gateway import)
  - `apps/web/src/features/monthly-scheduling/index.tsx` (added upload button + drawer)
  - `apps/web/src/features/monthly-scheduling/components/monthly-scheduling-upload-drawer.tsx` (new file)
- **Learnings:**
  - AI SDK v6 uses `maxOutputTokens` instead of `maxTokens`, and `usage.inputTokens`/`usage.outputTokens` instead of `promptTokens`/`completionTokens`
  - Elysia handler context destructuring: `log` is not available in all endpoint types — the `betterAuth` plugin doesn't expose it
  - ExcelJS `workbook.xlsx.load()` requires `as any` cast with Node.js v24 due to Buffer generic type changes
  - The AI gateway (`@ai-sdk/gateway`) is already configured in contract-extraction controller — reused the same pattern with a separate instance
---

