# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **GasCalculationService** (`apps/server/src/modules/gas/gas.service.ts`): Pure calculation functions with no DB deps. Add new methods here for gas math, keep them stateless.
- **Entry creation flow**: POST `/gas/units/:unitId/entries` in `gas.controller.ts` does validation → calculation → upsert (create or update) → side effects (line statuses, daily plan upsert). Follow this pattern for new endpoints.
- **Elysia Treaty path params**: Use function call syntax `api.gas.units({ unitId }).entries.post(body)` for parameterized routes (not bracket `[unitId]` notation — bracket works at runtime but fails TypeScript).
- **Data shape mismatch pitfall**: Frontend form may use different shapes than server schema (e.g., `Record<id, status>` vs `Array<{equipmentId, status}>`). Always check Elysia `t.Object()` schemas when wiring up API calls.
- **Date format for Elysia**: Elysia's `t.String({ format: "date" })` expects `YYYY-MM-DD`, not ISO 8601 datetime. Format with `getFullYear()-getMonth()-getDate()` before sending.
- **Frontend mirrors server calc**: `daily-entry-form.tsx` duplicates calculation logic client-side for real-time preview. Keep both in sync.
- **Auth DB vs plain DB**: Use `authDb.$setAuth(...)` (as `userDb`) for creating records that need `createdById` auto-set. Use plain `db` for reads and updates that don't need auth context.
- **ZenStack compound unique**: Model `@@unique([unitId, date])` creates a compound key. For upsert, use findFirst + create/update pattern since the compound key name varies.
- **Unit tests**: Use `bun:test` for server-side tests. No vitest setup needed. Run with `bun test <path>`.
- **Read-only feature pattern**: To make a feature read-only, remove the provider/context (dialog state), form, drawer, row actions, and checkbox columns. Add `useNavigate()` with `onClick` on `<TableRow>` for drill-through navigation.
- **Elysia Treaty nested path params**: For deeply nested routes like `/gas/daily-plans/:planId/submit`, use `api.gas["daily-plans"]({ planId }).submit.post({})` — bracket notation for hyphenated path segments, function call for params.
- **Dashboard drawer pattern**: Reuse existing form components (e.g., `DailyEntryForm`) inside a `Sheet` drawer opened from table row actions. Provider holds `drawerOpen` state + `selectedUnitId`.

---

## 2026-02-25 - US-001
- Implemented automatic QDP (Quantidade Diária Programada) derivation from equipment ON/OFF status
- Added `calculateQdp()` method to `GasCalculationService` — accepts array of equipment with status, consumption rate, unit, and planned hours
- Updated `POST /gas/units/:unitId/entries` to auto-create/update `GasDailyPlan` record with derived QDP value after saving a daily entry
- Updated frontend `daily-entry-form.tsx` to show real-time QDP preview (emerald-colored card) alongside existing QDS calculation
- Created comprehensive unit tests in `gas.service.test.ts` (20 tests covering calculateQdp, calculateQdcAtomizer, calculateQdcLines, calculateQds, calculateDeviations)
- Files changed:
  - `apps/server/src/modules/gas/gas.service.ts` — added `QdpEquipmentInput` interface and `calculateQdp` method
  - `apps/server/src/modules/gas/gas.controller.ts` — added QDP derivation + GasDailyPlan upsert after entry creation
  - `apps/web/src/components/gas/daily-entry-form.tsx` — added QDP preview card in calculation section
  - `apps/server/src/modules/gas/gas.service.test.ts` — new test file
- **Learnings:**
  - Pre-existing typecheck failures in `@acme/tailwind-config` and `packages/ui` (editor components) — unrelated to gas module
  - Pre-existing lint setup broken (no eslint config for server) — `pnpm lint` fails but not due to code quality
  - Server uses `bun` runtime, so `bun:test` works out of the box without any vitest setup
  - QDP formula is effectively the same as QDS (sum of equipment consumption), but stored separately in `GasDailyPlan` for the scheduling workflow
  - `GasDailyPlan` has submission/approval workflow fields — auto-derived QDP is created without submitting, leaving the workflow intact
---

## 2026-02-25 - US-004
- Investigated and fixed daily entry persistence bug — entries were never reaching the server
- Root causes found and fixed:
  1. **Route mismatch (CRITICAL)**: Frontend called `api.gas.entries.post()` (→ `POST /api/gas/entries`) but server expects `POST /api/gas/units/:unitId/entries`. Fixed to `api.gas.units({ unitId }).entries.post(body)`.
  2. **lineStatuses shape mismatch**: Form sent `Record<string, "on"|"off">` but server expects `Array<{equipmentId, status}>`. Added `Object.entries()` conversion.
  3. **Date format mismatch**: Form sent full ISO datetime (`toISOString()`) but server schema has `format: "date"` (YYYY-MM-DD). Fixed to format as `YYYY-MM-DD`.
  4. **qdsManual field not mapped**: Form had separate `qdsManualOverride` + `qdsManualValue` fields but sent them raw. Fixed to map to server's single `qdsManual` field conditionally.
  5. **No upsert support**: Server returned 409 Conflict for duplicate date+unit. Changed to upsert: update existing entry + delete/recreate line statuses.
  6. **Type error (pre-existing)**: `Equipment.currentConstant` type didn't accept `null` from API response. Added `| null` to union type.
- Files changed:
  - `apps/web/src/routes/_authenticated/gas/entry.tsx` — fixed Treaty API call path, data shape transformation, date formatting, qdsManual mapping, error handling
  - `apps/server/src/modules/gas/gas.controller.ts` — changed POST to upsert (findFirst + create/update), removed 409 response, fixed date parsing
  - `apps/web/src/components/gas/daily-entry-form.tsx` — fixed `currentConstant` type to accept `null`
- **Learnings:**
  - Elysia Treaty function call syntax `api.gas.units({ unitId })` is required for TS; bracket `[unitId]` works at runtime but fails typecheck
  - When wiring frontend to Elysia, always verify: route path, body shape vs `t.Object()` schema, and date format expectations
  - Upsert pattern: `findFirst + create/update` with `deleteMany` for child records before re-creating them
  - Pre-existing typecheck failure in `@acme/tailwind-config` is unrelated; web app now has 0 TS errors
---

## 2026-02-25 - US-002
- Converted the "Programação Diária" tab (`/gas/scheduling`) from a full CRUD interface to a read-only summary view
- Removed all edit controls: "Nova Programação" button, row actions dropdown (edit/delete/submit), create/update drawer, form, delete/submit confirmation dialogs, checkbox selection column
- Added "Somente leitura" badge next to the page title for clear visual indication
- Updated subtitle to explain this is a summary and link to the Painel de Programação for editing
- Added "Ir para o Painel" button in the header area
- Made table rows clickable — clicking navigates to `/gas/scheduling-dashboard?filter=<unitName>` to filter by that unit
- Removed `submittedByUser` from the `DailyPlanWithRelations` type (was required but never fetched, causing a type error)
- Removed unused `@ts-expect-error` directive that was no longer needed
- Files changed:
  - `apps/web/src/features/daily-scheduling/index.tsx` — removed provider, dialogs, primary buttons; added read-only badge, link to dashboard, "Ir para o Painel" button
  - `apps/web/src/features/daily-scheduling/components/daily-scheduling-columns.tsx` — removed select checkbox column, actions column, unused imports (Checkbox, DataTableRowActions, Clock); exported `DailyPlanWithRelations` type; removed `submittedByUser` from type
  - `apps/web/src/features/daily-scheduling/components/daily-scheduling-table.tsx` — removed row selection state/config; added `useNavigate` for row click navigation; made rows clickable with cursor-pointer and tooltip
- **Learnings:**
  - The feature provider pattern (`*-provider.tsx`) is only needed for CRUD features with dialog state; read-only views can skip it entirely
  - When removing columns from TanStack Table, also remove the corresponding `enableRowSelection` and `onRowSelectionChange` from table config
  - Pre-existing ESLint config broken (`@repo/eslint-config` not found) — linter hook fails but not due to code quality
  - `@ts-expect-error` directives may become stale when routes are properly registered — check after modifications
---

## 2026-02-25 - US-003
- Transformed the Scheduling Dashboard (`/gas/scheduling-dashboard`) from a read-only status view into the single point of entry for creating and managing daily schedules
- Added server-side endpoints:
  - `POST /gas/daily-plans/:planId/submit` — marks a plan as submitted with timestamp and user
  - `POST /gas/daily-plans/:planId/approve` — approves or rejects a submitted plan with optional rejection reason
- Added entry creation drawer: clicking "Programar" on any unit row opens a `Sheet` with the full `DailyEntryForm` (equipment ON/OFF toggles, atomizer hours, QDP auto-calculation)
- Added workflow columns: "Fluxo" column shows Rascunho → Aguardando Aprovação → Aprovado/Rejeitado badges
- Added workflow action buttons in the actions column: Submeter, Aprovar, Rejeitar (with prompt for rejection reason)
- Updated summary cards from 4 to 5: Total, Programado, Pendente, Submetido, Aprovado
- Updated subtitle to reflect entry capabilities: "Crie, submeta e aprove a programação diária de todas as unidades."
- Extended `UnitSchedulingStatus` interface with `planId`, `submitted`, `approved`, `rejectionReason` fields
- Existing date picker (prev/next day, calendar popup, "Hoje" button) already satisfies date navigation AC
- Files changed:
  - `apps/server/src/modules/gas/gas.controller.ts` — added POST submit + approve endpoints
  - `apps/web/src/features/scheduling-dashboard/index.tsx` — added entry drawer component
  - `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-provider.tsx` — added `drawerOpen`, `selectedUnitId` state
  - `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-entry-drawer.tsx` — new drawer with DailyEntryForm
  - `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-columns.tsx` — added workflow column, action buttons (Programar/Editar, Submeter, Aprovar, Rejeitar)
  - `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-table.tsx` — added workflow data, submit/approve mutations, handler functions
- **Learnings:**
  - Elysia Treaty for hyphenated paths: `api.gas["daily-plans"]({ planId }).submit.post({})` — bracket notation for the segment, function call for the param
  - Reuse the shared `DailyEntryForm` component inside a Sheet — it accepts `unit`, `defaultValues`, and `onSubmit` making it composable
  - ZenStack `useFindMany` returns plan fields including `submitted`, `approved`, `rejectionReason` without extra configuration
  - `window.prompt()` is sufficient for rejection reason input in MVP — can be upgraded to a dialog later
  - The `columns` factory function can accept an `actions` object to decouple column definitions from component state/handlers
---

## 2026-02-25 - US-007
- Implemented CUSD penalty calculation methods in `gas.service.ts`: `calculatePvema`, `calculatePveme`, `calculateSobredemanda`, `calculateDailyPenalties`, `calculateMonthlyPenalties`
- Implemented monthly accuracy/assertiveness methods: `calculateMonthlyAccuracy`
- Added 34 new unit tests (total now 54) covering:
  - PVEMA: within tolerance, at boundary, above tolerance, zero consumption, large excess scenario
  - PVEME: within tolerance, at boundary, below tolerance, zero consumption, slight deficit scenario
  - Sobredemanda: within tier 1, tier 2 only, tier 2+3, boundary values, zero consumption
  - Daily penalties: combined scenarios (normal, high, low, zero)
  - Monthly penalties: accumulated across days, empty array, partial month
  - Monthly accuracy: normal month, empty data, zero QDP days, all-within, all-exceeded, partial month
- Files changed:
  - `apps/server/src/modules/gas/gas.service.ts` — added interfaces (`CusdPenaltyParams`, `DailyPenaltyResult`, `MonthlyDayEntry`, `MonthlyAccuracyResult`) and 6 new calculation methods + `round2` helper
  - `apps/server/src/modules/gas/gas.service.test.ts` — added 34 new tests for penalty and accuracy calculations
- **Learnings:**
  - CUSD penalty formulas are per-day calculations: PVEMA for upper excess, PVEME for lower deficit, Sobredemanda for tiered overdemand — they are independent and can all apply on the same day
  - Sobredemanda tiers are based on % of QDC (not tolerance limits), so tier 1 max of 110% means up to 110% of QDC is free, not 110% of tolerance
  - Monthly penalties are simple daily sums — no complex accumulation logic needed
  - Assertiveness rate counts days within tolerance as % of days with data; accuracy rate averages QDR/QDP ratios only for days where QDP > 0
  - Contract model already has all needed fields (`pvemaTolerancePercent`, `pvemeTolerancePercent`, `overdemandTier*`, `tusdTariffPerUnit`, `basePricePerUnit`)
---

## 2026-02-25 - US-005
- Implemented QDP vs QDR comparison chart on the `/gas/reports` page
- No new server endpoint needed — reused existing `/gas/consolidated` endpoint which already returns per-unit QDP/QDR daily data and contract tolerance percentages
- Added a dedicated "Planejado vs Realizado" card with:
  - Month selector (reuses `generateMonthOptions()` pattern from existing Petrobras report)
  - Unit filter (all units aggregated or single unit) populated from consolidated endpoint's `units` array
  - ComposedChart with grouped bars for QDP (purple) and QDR (green/red)
  - Tolerance band shaded region using `ReferenceArea` from recharts
  - QDR bars colored red when exceeding tolerance (±10%/−20% from contract), green when within
  - Custom tooltip component showing exact QDP, QDR values, deviation %, tolerance info, and "Fora da tolerância" badge
  - Legend explanation for tolerance highlighting
- Files changed:
  - `apps/web/src/routes/_authenticated/gas/reports.tsx` — added comparison chart section, ComparisonTooltip component, consolidated data query, unit filter state, tolerance computation
- **Learnings:**
  - The `/gas/consolidated` endpoint already returns per-unit breakdown in `dailySummaries[].units[]` with `qdp` and `qdr` fields — no need for a new endpoint
  - CUSD tolerance bands (±10% / −20%) map to the contract's `transportToleranceUpperPercent` / `transportToleranceLowerPercent` fields already returned by consolidated
  - Recharts `Cell` component allows per-bar coloring — use it inside `<Bar>` to conditionally color bars based on data (e.g., tolerance exceeded)
  - `ReferenceArea` with `y1`/`y2` creates a horizontal tolerance band; use `Math.min`/`Math.max` across all data points to compute band boundaries
  - Pre-existing typecheck errors in `ChartTooltipContent` are a known issue with recharts types — not caused by new code
---

