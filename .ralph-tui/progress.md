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
