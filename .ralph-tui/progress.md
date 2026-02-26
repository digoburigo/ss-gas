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
- **Many-to-many with join model**: For GasUnit ↔ GasContract, use `GasUnitContract` join model with `@@unique([unitId, contractId])`. Keep legacy FK (`contractId`) on GasUnit for backward compat. Query join table with `include: { unitContracts: { include: { contract: true } } }`.
- **Contract selector pattern**: Use `ContractSelector` component (`components/gas/contract-selector.tsx`) — auto-hides when only 1 contract exists, shows dropdown when multiple. Pass `contracts` array from API response.
- **Server multi-contract pattern**: Add optional `contractId` query param to endpoints. When provided, fetch that specific contract; otherwise, fall back to org-wide active contract query. Return `contracts` array alongside `contract` for frontend selector.

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

## 2026-02-25 - US-006
- Implemented monthly scorecard (Placar Mensal) on `/gas/scheduling-accuracy` page as a new "Placar Mensal" tab
- Created server endpoint `GET /gas/monthly-scorecard` with query params `month` (YYYY-MM) and optional `unitId`
  - Fetches GasDailyPlan (QDP) and GasRealConsumption (QDR) for the month, groups by date
  - Uses `GasCalculationService.calculateMonthlyAccuracy()` for assertiveness/accuracy rates
  - Uses `GasCalculationService.calculateMonthlyPenalties()` for PVEMA + PVEME + Sobredemanda
  - Falls back to transport tolerance values when CUSD-specific penalty params are null on the contract
- Created `MonthlyScorecard` component with 3 color-coded cards:
  - Taxa de Assertividade (%) — days within tolerance / total days
  - Taxa de Acurácia Média (%) — mean QDR/QDP × 100
  - Penalidade Acumulada (R$) — PVEMA + PVEME + Sobredemanda breakdown
- Month/year selector (last 12 months dropdown) and unit filter
- Contract info displayed as read-only reference
- Green/yellow/red thresholds with badges and color-coded borders
- Tolerance reference card showing contract upper/lower limits and QDC
- Files changed:
  - `apps/server/src/modules/gas/gas.controller.ts` — added `GET /gas/monthly-scorecard` endpoint
  - `apps/web/src/features/scheduling-accuracy/components/monthly-scorecard.tsx` — new scorecard component
  - `apps/web/src/features/scheduling-accuracy/index.tsx` — added "Placar Mensal" tab (now default), imported MonthlyScorecard
- **Learnings:**
  - CUSD penalty params on contract model are all optional (nullable) — need fallback defaults when building `CusdPenaltyParams` for calculation
  - Elysia Treaty for hyphenated endpoints: `api.gas["monthly-scorecard"].get({ query: {...} })` — bracket notation for the segment
  - The scorecard reuses `GasCalculationService` methods from US-007 directly on the server, avoiding duplicating calculation logic on the frontend
  - `useQuery` from TanStack Query works well for the scorecard since it's a simple GET with query params — no need for ZenStack client queries here
  - Biome auto-fix with `--write` handles formatting; `--unsafe` removes unused imports
---

## 2026-02-25 - US-008
- Reinforced the alerts system across contract alerts, deviation alerts, and scheduled jobs
- **Server-side changes:**
  - Added `retryFailedAlerts()` method to `ContractAlertService` — queries failed GasAlertSentLog entries from the last 7 days, retries sending, and updates original log status on success
  - Added `POST /gas/alerts/retry` endpoint (admin-only) to manually trigger retry of failed alerts
  - Added `POST /gas/deviation-alerts/send-email` endpoint for sending deviation alert emails to specified recipients using the `DeviationAlertEmail` template
  - Added retry cron job at 10 AM daily in `scheduled-jobs.ts` plugin
  - Exported `DeviationAlertEmail` from `@acme/email/emails` package (template existed but was not exported)
- **Frontend changes:**
  - Replaced TODO stubs in deviation alerts `index.tsx` with real API calls for email sending via `api.gas["deviation-alerts"]["send-email"].post()`
  - Added local state tracking for acknowledged alerts and email sent status (since deviations are computed, not persisted)
  - Added "Entrega" (delivery status) column to contract alerts table showing sent/pending/failed with tooltip dates
  - Included `sentAlerts` relation in contract alerts ZenStack query to power the status column
  - Fixed unused `@ts-expect-error` in `contract-alerts-table.tsx`
- Files changed:
  - `apps/server/src/services/contract-alert.service.ts` — added `retryFailedAlerts()` method
  - `apps/server/src/modules/gas/gas.controller.ts` — added retry and deviation email endpoints, imported `sendEmail` and `DeviationAlertEmail`
  - `apps/server/src/plugins/scheduled-jobs.ts` — added `retryFailedAlerts` cron job at 10 AM
  - `apps/web/src/features/deviation-alerts/index.tsx` — replaced TODO stubs with real API calls, added acknowledgement/email state tracking
  - `apps/web/src/features/contract-alerts/components/contract-alerts-columns.tsx` — added "Entrega" delivery status column with Tooltip
  - `apps/web/src/features/contract-alerts/components/contract-alerts-table.tsx` — added `sentAlerts` to query, fixed `@ts-expect-error`
  - `packages/email/src/emails/index.ts` — exported `DeviationAlertEmail`
- **Learnings:**
  - `DeviationAlertEmail` template already existed in `packages/email/src/emails/` but wasn't exported from the barrel file — always check exports when using email templates
  - Deviation alerts are computed on-the-fly (comparing GasRealConsumption vs GasDailyPlan), not persisted as records — acknowledgement state must be stored locally or in a separate model
  - GasAlertSentLog `include: { alert: { include: { ... } } }` fetches the full alert with relations, enabling retry without re-fetching alert config
  - Elysia Treaty for nested hyphenated paths: `api.gas["deviation-alerts"]["send-email"].post({})` — each path segment with hyphens uses bracket notation
  - Pre-existing TS error in `DataTableRowActions` due to duplicate type definitions in different files (columns vs row-actions) — not introduced by this change
  - Cron jobs in `@elysiajs/cron` are chained with `.use()` — each job is an independent plugin
---

## 2026-02-25 - US-010
- Implemented full equipment CRUD management as a new "Equipamentos" tab in the Admin Parameters page (`/gas/admin-parameters`)
- **Server-side changes:**
  - Added `GET /gas/equipment/:equipmentId/can-delete` endpoint to validate equipment deletion (blocks if equipment has associated daily entries/line statuses)
- **Frontend changes:**
  - Created `EquipmentManagementTab` component as a self-contained tab with:
    - Data table with columns: Código, Nome, Tipo, Unidade, Constante Atual, Ordem, Status, Ações
    - Filters by search text (code/name), equipment type, unit, and active status
    - Create/Edit equipment via Sheet drawer (code, name, type, unit, order index, active)
    - Deactivate/reactivate equipment (soft toggle via ConfirmDialog)
    - Delete equipment with validation (API check for associated daily entries)
    - Constants management panel (Sheet drawer per equipment):
      - View all consumption constants ordered by date
      - Add new constants with rate, unit, effective from/to, notes
      - End constant validity (set effectiveTo = today)
      - Delete constants
  - Added "equipment" value to `ParameterCategory` type in admin-parameters provider
  - Added "Equipamentos" entry with Cog icon to `parameterCategories` data array
  - Imported and rendered `EquipmentManagementTab` in the admin-parameters Tabs component
- Files changed:
  - `apps/server/src/modules/gas/gas.controller.ts` — added can-delete endpoint for equipment
  - `apps/web/src/features/admin-parameters/components/equipment-management-tab.tsx` — new comprehensive equipment management component
  - `apps/web/src/features/admin-parameters/components/admin-parameters-provider.tsx` — added "equipment" to ParameterCategory union
  - `apps/web/src/features/admin-parameters/data/data.tsx` — added Cog import and equipment category entry
  - `apps/web/src/features/admin-parameters/index.tsx` — imported and rendered EquipmentManagementTab
- **Learnings:**
  - ZenStack client `useFindMany` with `include: { constants: true }` fetches all related `GasEquipmentConstant` records inline, making it easy to display the "current constant" without a separate query
  - For self-contained CRUD tabs (no separate route), a single component with internal state can replace the full Provider + Table + Columns + Form + Dialogs + RowActions pattern — simpler for admin-embedded features
  - Equipment links to units via `unitId` (not to contracts directly); the unit→contract link provides indirect contract association
  - `@tanstack/react-form` zod validators: form default values must match zod types exactly — `z.string().optional()` doesn't work when default is `""` (a string, not undefined); use `z.string()` instead
  - The `can-delete` endpoint pattern (check-before-delete) works well for equipment: count `GasLineStatus` records where `equipmentId` matches
---

## 2026-02-25 - US-012
- Implemented multiple contracts per unit support (many-to-many relationship)
- **Schema changes:**
  - Added `GasUnitContract` join model with `unitId`, `contractId`, `isPrimary`, and `@@unique([unitId, contractId])`
  - Added `unitContracts GasUnitContract[]` reverse relations on both `GasUnit` and `GasContract`
  - Kept existing `GasUnit.contractId` FK for backward compatibility (legacy single-contract)
- **Server changes:**
  - Updated `GET /gas/consolidated` to accept optional `contractId` query param and return `contracts` array for selector
  - Updated `GET /gas/monthly-scorecard` to accept optional `contractId` query param and return `contracts` array
  - Updated `GET /gas/reports/petrobras` and `GET /gas/reports/petrobras/download` to accept optional `contractId`
  - All endpoints fall back to org-wide active contract when `contractId` not provided (backward compat)
- **Frontend changes:**
  - Created reusable `ContractSelector` component (`components/gas/contract-selector.tsx`) — auto-hides when ≤1 contract
  - Updated consumer unit form to support multi-contract selection with primary contract indicator
  - Updated consumer unit mutate drawer to sync `GasUnitContract` join table (create/delete/update isPrimary)
  - Updated contracts table to show units from both legacy FK and join table, with primary badge
  - Added contract selector to gas dashboard, reports page, and monthly scorecard (only visible when >1 contract)
  - Updated scheduling dashboard table to include `unitContracts` relation and show multiple contract names per unit
  - Updated `UnitSchedulingStatus` interface with `contractNames: string[]`
  - Removed stale `@ts-expect-error` in scheduling dashboard table
- Files changed:
  - `packages/zen-v3/schema.zmodel` — added GasUnitContract model and relations
  - `packages/zen-v3/src/zenstack/{input,models,schema}.ts` — regenerated
  - `apps/server/src/modules/gas/gas.controller.ts` — contractId param on 4 endpoints, contracts array in responses
  - `apps/web/src/components/gas/contract-selector.tsx` — new shared component
  - `apps/web/src/features/consumer-units/components/consumer-unit-form.tsx` — multi-contract selection UI
  - `apps/web/src/features/consumer-units/components/consumer-units-mutate-drawer.tsx` — GasUnitContract sync logic
  - `apps/web/src/features/contracts/components/contracts-columns.tsx` — merged unit display from join table
  - `apps/web/src/features/contracts/components/contracts-table.tsx` — added unitContracts include
  - `apps/web/src/features/gas/index.tsx` — contract selector + contractId in query
  - `apps/web/src/features/scheduling-accuracy/components/monthly-scorecard.tsx` — contract selector
  - `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-columns.tsx` — multi-contract display
  - `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-table.tsx` — unitContracts include, contractNames
  - `apps/web/src/routes/_authenticated/gas/reports.tsx` — contract selector + contractId in queries
- **Learnings:**
  - ZenStack's `useFindMany` doesn't support `enabled` option like TanStack Query — use an empty-string-ID where clause as a workaround
  - Keep legacy FK (`contractId`) on GasUnit for backward compat — the join table adds multi-contract on top
  - `ContractSelector` component pattern: auto-hide when ≤1 contract ensures no visual change for single-contract orgs
  - The `contracts` array in API responses enables the frontend to populate the selector without a separate API call
  - Type-safe access to included relations from ZenStack requires casting to `Record<string, unknown>` when the base model type doesn't include the relation
  - Pre-existing ESLint config broken (`@repo/eslint-config` not found), pre-existing TS errors in packages/ui (editor) and seed files — unrelated
---

## 2026-02-25 - US-009
- Implemented consolidated reports dashboard with 5 charts on `/gas/reports` page
- **Server-side changes:**
  - Added `GET /gas/reports/dashboard` endpoint — accepts `startMonth`, `endMonth`, optional `unitId` and `contractId` query params
    - Returns: `consumptionByUnit` (monthly QDP vs QDR per unit), `penaltiesByMonth` (PVEMA/PVEME/Sobredemanda per month), `assertivenessTrend` (monthly assertiveness/accuracy rates), `unitComparison` (per-unit accuracy ranking), `equipmentTypeDistribution` (consumption by equipment type)
    - Reuses `GasCalculationService.calculateMonthlyPenalties()` and `.calculateMonthlyAccuracy()` from US-007
  - Added `GET /gas/reports/dashboard/download` endpoint — generates Excel (XLSX) with 4 sheets: Consumo por Unidade, Penalidades, Assertividade, Consumo por Tipo
- **Frontend changes:**
  - Restructured `/gas/reports` page into Tabs: "Dashboard" (new, default) and "Relatório Petrobras" (existing)
  - Dashboard tab contains:
    1. **Consumo Mensal Planejado vs Realizado por Unidade** — grouped bar chart (QDP purple, QDR green) per unit per month
    2. **Penalidades Acumuladas** — line chart showing PVEMA, PVEME, Sobredemanda, and Total over months
    3. **Taxa de Assertividade Histórica** — line chart showing assertiveness rate and accuracy rate trend
    4. **Comparativo entre Unidades** — horizontal bar chart ranking units by assertiveness rate (green/yellow/red color-coded)
    5. **Consumo por Tipo de Equipamento** — donut chart (Atomizador, Linha de Produção)
  - Filters: Date range preset (Mensal/Trimestral/Anual), Unit filter, Contract selector
  - Export: "Exportar Excel" button downloads the dashboard data as XLSX
  - All existing Petrobras report functionality preserved in second tab
- Files changed:
  - `apps/server/src/modules/gas/gas.controller.ts` — added dashboard and dashboard/download endpoints (~450 lines)
  - `apps/web/src/routes/_authenticated/gas/reports.tsx` — restructured with Tabs, added DashboardTab component with 5 charts
- **Learnings:**
  - Using `Map` instead of `Record` with `Object.defineProperty` for date-keyed aggregation is cleaner and avoids TS strictness issues
  - ExcelJS `workbook.xlsx.writeBuffer()` returns `ArrayBuffer` that can be wrapped in `new Response()` for Elysia file downloads
  - Recharts `BarChart` with `layout="vertical"` creates horizontal bar charts; requires swapping XAxis type="number" and YAxis type="category"
  - `Cell` component inside `<Bar>` enables per-bar conditional coloring — used for green/yellow/red thresholds on the unit comparison chart
  - Pre-existing `ChartTooltipContent` TS errors continue (known recharts types issue) — not introduced by this change
  - Tabs pattern from `@acme/ui/tabs` works well for organizing related report views under one route
---

