# Ralph Progress Log

This file tracks progress across iterations. It's automatically updated
after each iteration and included in agent prompts for context.

## Codebase Patterns (Study These First)

### ZenStack Model Patterns
- Use `@id @default(dbgenerated("uuidv7()"))` for primary keys
- Use `@default(auth().organizationId)` for organization-scoped models
- Use `@default(auth().userId)` for audit fields
- Use `@@map("table_name")` for PostgreSQL table naming (snake_case)
- Use `@@unique([field1, field2])` for composite unique constraints
- Access policies: `@@allow('create', auth() != null)` for authenticated users
- Use named relations like `@relation("relationName")` when a User model has multiple relations to the same model (e.g., createdBy, updatedBy)
- DateTime date-only fields use `@db.Date` annotation

### Seed Script Patterns
- Seed scripts live in `apps/server/` (e.g., `seed.ts`, `seed-gas.ts`)
- Run with `pnpm --filter @acme/server db:seed` or `db:seed-gas`
- Use `authDb.$setAuth({ userId, organizationId, ... })` for models with auth-dependent defaults
- Always fetch a real user from DB when seeding models with `createdById` FK constraints
- Clear dependent tables before parent tables (delete in reverse order of creation)

### Elysia Module Patterns
- Modules live in `apps/server/src/modules/{module-name}/`
- Each module has `{module}.controller.ts` for Elysia endpoints
- Each module has `index.ts` for re-exports
- Controllers use `new Elysia({ prefix: "/{module}" })` for route grouping
- Register modules in `apps/server/src/index.ts` with `.use(moduleController)`
- Typecheck with `pnpm --filter @acme/server check-types`

### Service Patterns
- Service files live in `apps/server/src/modules/{module-name}/{module}.service.ts`
- Export service and types from module `index.ts`
- Use plain object with methods for services (not class-based)
- Define local types for enum values to avoid import issues from zen-v3 generated files (enums are in models.ts but not exported from package index)

### Elysia Controller Patterns
- Use `auth: true` macro to require authentication on endpoints
- Access `user` and `session` from handler context when authenticated
- Use `authDb.$setAuth({ userId, organizationId, ... })` for models with auth defaults
- Use `db` directly for read-only or non-auth-dependent queries
- Define input schemas with `t.Object({...})` at top of file
- Use `t.Number({ minimum: X, maximum: Y })` for range validation
- Return error responses with `status(404, { error: "..." })`
- Define response schemas for 200, 400, 404, 409 etc.

### React Form Component Patterns
- Forms live in `apps/web/src/components/{module}/{form-name}.tsx`
- Use `@tanstack/react-form` with `useForm` hook
- UI components imported from `@acme/ui/{component}`
- Use `useMemo` to derive computed values from props
- Use `form.Subscribe` with `selector` for reactive calculations
- Define TypeScript interfaces for form data and props
- Export component from module `index.ts`

---

## 2026-01-20 - US-001
- **What was implemented:** Added all gas consumption related models to schema.zmodel
- **Files changed:**
  - `packages/zen-v3/schema.zmodel` - Added enums, models, and relations
  - `packages/zen-v3/src/zenstack/` - Generated TypeScript files
- **Models added:**
  - Enums: EquipmentType, ConsumptionUnit, LineStatusValue, ConsumptionSource
  - GasUnit, GasEquipment, GasEquipmentConstant
  - GasDailyEntry, GasLineStatus
  - GasDailyPlan, GasRealConsumption, GasContract
- **Learnings:**
  - Patterns discovered:
    - ZenStack uses `pnpm run db:generate` from root to generate TypeScript client
    - Named relations are required when User has multiple fields referencing the same model
    - Use `@db.Date` for date-only fields (no time component)
  - Gotchas encountered:
    - The expo app has pre-existing typecheck errors (unrelated to this task)
    - ZenStack generate runs from root, not from the package directory
### ZenStack Database Commands
- `db:generate` - Run from `packages/zen-v3/` directory: `pnpm run db:generate`
- `db:push` - Run from `packages/zen-v3/` directory: `pnpm run db:push` (uses dotenv for env vars)
- Root `pnpm run db:push` uses turbo but requires TUI mode (`--ui=tui`)

---

## 2026-01-20 - US-002
- **What was implemented:** Ran database generation and pushed schema to database
- **Commands executed:**
  - `pnpm run db:generate` from `packages/zen-v3/` - Generated TypeScript files successfully
  - `pnpm run db:push` from `packages/zen-v3/` - Applied schema to PostgreSQL database
- **Files affected:**
  - `packages/zen-v3/src/zenstack/schema.ts` - Regenerated with all gas models
  - `packages/zen-v3/src/zenstack/models.ts` - Regenerated
  - `packages/zen-v3/src/zenstack/input.ts` - Regenerated
- **Database tables created:**
  - gas_units, gas_equipment, gas_equipment_constants
  - gas_daily_entries, gas_line_status
  - gas_daily_plans, gas_real_consumption, gas_contracts
- **Learnings:**
  - Patterns discovered:
    - Run `db:generate` and `db:push` from the `packages/zen-v3/` directory directly
    - The root `db:push` uses turbo which requires TUI mode for interactive tasks
    - `pnpm with-env` wrapper handles loading .env from root
  - Gotchas encountered:
    - Root `pnpm run db:push` fails without TUI mode - use package-level command instead
    - Typecheck on zen-v3 package passes cleanly after generation
---

## ✓ Iteration 1 - US-001: Add ZenStack models to schema.zmodel
*2026-01-20T03:29:45.310Z (299s)*

**Status:** Completed

**Notes:**
unitId+date\n- [x] LineStatus model (GasLineStatus) with entry and equipment relations\n- [x] DailyPlan model (GasDailyPlan) with approval workflow fields (submitted, approved, rejectionReason, etc.)\n- [x] RealConsumption model (GasRealConsumption) with source tracking (ConsumptionSource enum)\n- [x] Contract model (GasContract) with tolerance band fields (transportToleranceUpperPercent, transportToleranceLowerPercent, moleculeTolerancePercent)\n- [x] Access policies defined for all models\n\n

---

## 2026-01-20 - US-003
- **What was implemented:** Created seed script for gas units and equipment
- **Files changed:**
  - `apps/server/seed-gas.ts` - New seed script for gas data
  - `apps/server/package.json` - Added `db:seed-gas` script
- **Data seeded:**
  - **Units (3):**
    - Criciúma (CRI): 1 atomizer (1,500 m³/h) + 8 lines 0-7 (250 m³/h each)
    - Urussanga (URU): 1 atomizer (1,200 m³/h) + 2 lines 1-2 (200 m³/h each)
    - Botucatu (BOT): ATM 250 (2,500 m³/h), ATM 052 (520 m³/h), 2 lines (300 m³/h each), Secador 2 (800 m³/h)
  - **Contract:** QDC 134,800 m³/d with tolerance bands (+10%/-20% transport, ±5% molecule)
- **Learnings:**
  - Patterns discovered:
    - Seed scripts follow pattern in `apps/server/seed.ts`
    - Use `authDb.$setAuth()` with a real userId for models with `createdById` foreign key
    - The `db` client is used for models without auth-dependent defaults
  - Gotchas encountered:
    - Empty userId in auth context causes FK constraint violation for `createdById` fields
    - Must get a real user from DB for seed operations that create records with audit fields
---
## ✓ Iteration 2 - US-002: Run database generation and migration
*2026-01-20T03:31:58.816Z (132s)*

**Status:** Completed

**Notes:**
y** - `pnpm run db:generate` completed in 283ms\n- ✅ **Database schema updated with new tables** - `pnpm run db:push` synced the database with the Prisma schema\n- ✅ **No migration errors** - Both commands completed successfully, typecheck passed\n\nNote: Since US-002 is about running database commands (which don't produce file changes to commit), and the generated files were already committed in US-001, there are no new files to commit. The database has been updated with the new gas tables.\n\n

---
## ✓ Iteration 3 - US-003: Create seed script for units and equipment
*2026-01-20T03:35:35.345Z (216s)*

**Status:** Completed

**Notes:**
es 1-2)\n- [x] **Botucatu unit created with code BOT and equipment** (ATM 250, ATM 052, Lines 1-2, Secador 2)\n- [x] **Equipment constants set with correct consumption rates** (m³/h for each equipment)\n- [x] **Default contract created with QDC 134,800 m³/d and tolerance bands** (+10%/-20% transport, ±5% molecule)\n\n**Files changed:**\n- `apps/server/seed-gas.ts` - New seed script\n- `apps/server/package.json` - Added `db:seed-gas` script\n- `.ralph-tui/progress.md` - Updated with learnings\n\n

---

## 2026-01-20 - US-004
- **What was implemented:** Set up gas module structure in server
- **Files changed:**
  - `apps/server/src/modules/gas/gas.controller.ts` - New Elysia controller with `/gas` prefix
  - `apps/server/src/modules/gas/index.ts` - Re-export for cleaner imports
  - `apps/server/src/index.ts` - Registered gasController in main app
- **Learnings:**
  - Patterns discovered:
    - Modules follow `{module}.controller.ts` + `index.ts` pattern
    - Use `new Elysia({ prefix: "/modulename" })` for route grouping
    - Import `betterAuth` plugin in controllers needing authentication
    - Register modules with `.use(controller)` in main app
  - Gotchas encountered:
    - Server package uses `check-types` script (not `typecheck`)
    - ESLint not configured for server package (skip lint for now)
---
## ✓ Iteration 4 - US-004: Set up gas module structure in server
*2026-01-20T03:38:29.783Z (173s)*

**Status:** Completed

**Notes:**
ts` - Re-export file for cleaner imports\n\n**Files modified:**\n- `apps/server/src/index.ts` - Registered gasController in main app\n\n**Acceptance criteria met:**\n- ✅ Gas module folder created at `apps/server/src/modules/gas/`\n- ✅ `gas.controller.ts` file created with Elysia setup\n- ✅ Module registered in main server app\n\n**Verification:**\n- Typecheck passed with `pnpm --filter @acme/server check-types`\n- Committed with message: `feat: US-004 - Set up gas module structure in server`\n\n

---

## 2026-01-20 - US-005
- **What was implemented:** Created GasCalculationService with gas consumption calculation methods
- **Files changed:**
  - `apps/server/src/modules/gas/gas.service.ts` - New service with calculation methods
  - `apps/server/src/modules/gas/index.ts` - Updated to export service and types
- **Methods implemented:**
  - `calculateQdcAtomizer`: Calculates atomizer consumption, handles single and dual atomizer scenarios
  - `calculateQdcLines`: Sums consumption for lines with ON status only
  - `calculateQds`: Combines atomizer and lines consumption
  - `calculateDeviations`: Computes transport and molecule tolerance deviations with status
- **Learnings:**
  - Patterns discovered:
    - Services use plain object with methods pattern (not class-based)
    - Service files follow `{module}.service.ts` naming convention
    - Types exported alongside service for external consumption
  - Gotchas encountered:
    - ZenStack enums (like `LineStatusValue`, `EquipmentType`) are generated in `models.ts` but not exported from the zen-v3 package index
    - Define local type aliases matching enum values to avoid import issues
---
## ✓ Iteration 5 - US-005: Implement GasCalculationService
*2026-01-20T03:42:14.044Z (223s)*

**Status:** Completed

**Notes:**
s 131-143 filter by `status === \"on\"` and sum consumption\n- ✅ **calculateQds method combines atomizer and lines consumption** - Lines 154-156 simply adds both values\n- ✅ **calculateDeviations method computes transport and molecule tolerances** - Lines 174-226 calculate upper/lower limits for both tolerance types\n- ✅ **Deviation status (within/exceeded) correctly determined** - Transport has 3 states (`within`, `exceeded_upper`, `exceeded_lower`) and molecule has 2 (`within`, `exceeded`)\n\n

---

## 2026-01-20 - US-006
- **What was implemented:** Created daily entry API endpoints with validation and auto-calculation
- **Files changed:**
  - `apps/server/src/modules/gas/gas.controller.ts` - Added POST and GET endpoints
- **Endpoints implemented:**
  - `POST /gas/units/:unitId/entries` - Create new daily entry with validation
  - `GET /gas/units/:unitId/entries?month=YYYY-MM` - Get entries for a month
- **Features:**
  - Hours validation (0-24 range) via Elysia schema
  - Equipment ID validation (must belong to unit)
  - Auto-calculation of qdcAtomizer, qdcLines, qdsCalculated on save
  - Line statuses populated with equipment info on GET
  - Duplicate entry prevention (unique constraint on unitId+date)
- **Learnings:**
  - Patterns discovered:
    - Use `t.Number({ minimum: 0, maximum: 24 })` for range validation in Elysia
    - Use `authDb.$setAuth()` in controller handlers for models with auth defaults
    - Use `db` (not authDb) for read-only queries or models without auth defaults
    - Include relations with `include: { relation: { include: { nested: true } } }`
  - Gotchas encountered:
    - Array destructuring with `.map(Number)` needs null coalescing for TypeScript
    - Use `parts[0] ?? 0` instead of direct destructuring `[year, month]`
---
## ✓ Iteration 6 - US-006: Create daily entry API endpoints
*2026-01-20T03:45:39.981Z (205s)*

**Status:** Completed

**Notes:**
odules/gas/gas.controller.ts` - Added POST and GET endpoints with full validation and response schemas\n\n### Acceptance Criteria Met\n- ✅ POST /gas/units/:unitId/entries creates new entry with validation\n- ✅ Entry validation ensures hours 0-24, valid equipment IDs\n- ✅ Auto-calculation of qdcAtomizer, qdcLines, qdsCalculated on save\n- ✅ GET /gas/units/:unitId/entries returns entries for a month\n- ✅ Query parameter month in YYYY-MM format\n- ✅ Entries returned with line statuses populated\n\n

---

## 2026-01-20 - US-007
- **What was implemented:** Built unit entry form component for daily gas data entry
- **Files changed:**
  - `apps/web/src/components/gas/daily-entry-form.tsx` - New form component with all required fields
  - `apps/web/src/components/gas/index.ts` - Export file for gas components
- **Features:**
  - Date picker with auto-populated today's date
  - Atomizer scheduled toggle (Yes/No) with hours input
  - Secondary atomizer fields conditionally shown for units with 2+ atomizers (Botucatu)
  - Production line toggles dynamically rendered based on unit equipment
  - Observations text field
  - Real-time QDS calculation displayed with breakdown (atomizer + lines + total)
- **Learnings:**
  - Patterns discovered:
    - Follow existing form patterns from `products/product-form.tsx` and `clients/client-form.tsx`
    - Use `@tanstack/react-form` with `useForm` hook for form state
    - UI components imported from `@acme/ui/{component}`
    - Use `useMemo` to extract equipment subsets (atomizers, lines) from unit data
    - Use `form.Subscribe` with `selector` prop for reactive calculations
  - Gotchas encountered:
    - Avoid complex zod validators with `z.record(z.enum())` - causes type issues with TanStack Form
    - For nested Record fields, use single `form.Field` with `handleChange` on full object
    - Pre-existing typecheck errors in codebase (dash components, ui editor) - not related to new code
    - Ultracite/biome not installed despite being referenced in CLAUDE.md
---
