# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **GasCalculationService** (`apps/server/src/modules/gas/gas.service.ts`): Pure calculation functions with no DB deps. Add new methods here for gas math, keep them stateless.
- **Entry creation flow**: POST `/gas/units/:unitId/entries` in `gas.controller.ts` does validation → calculation → DB write → side effects (line statuses, daily plan upsert). Follow this pattern for new endpoints.
- **Frontend mirrors server calc**: `daily-entry-form.tsx` duplicates calculation logic client-side for real-time preview. Keep both in sync.
- **Auth DB vs plain DB**: Use `authDb.$setAuth(...)` (as `userDb`) for creating records that need `createdById` auto-set. Use plain `db` for reads and updates that don't need auth context.
- **ZenStack compound unique**: Model `@@unique([unitId, date])` creates a compound key. For upsert, use findFirst + create/update pattern since the compound key name varies.
- **Unit tests**: Use `bun:test` for server-side tests. No vitest setup needed. Run with `bun test <path>`.

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

