# Ralph Progress Log

This file tracks progress across iterations. It's automatically updated
after each iteration and included in agent prompts for context.

## Codebase Patterns (Study These First)

### Feature Structure Pattern
Features follow a consistent folder structure under `apps/web/src/features/{feature-name}/`:
- `index.tsx` - Main feature component with layout (Header, Main)
- `components/` folder:
  - `{feature}-provider.tsx` - Context provider for dialog state management
  - `{feature}-table.tsx` - Data table with URL-synced filtering/pagination
  - `{feature}-columns.tsx` - TanStack Table column definitions
  - `{feature}-form.tsx` - TanStack Form with Zod validation
  - `{feature}-mutate-drawer.tsx` - Sheet/drawer for create/update
  - `{feature}-dialogs.tsx` - Confirmation dialogs (delete, status toggle)
  - `{feature}-primary-buttons.tsx` - Primary action buttons
  - `data-table-row-actions.tsx` - Dropdown menu for row actions
- `data/` folder:
  - `data.tsx` - Static data like filter options

### ZenStack Access Policies
- Use `@@allow('read', true)` for public read access
- Use `@@allow('create,update,delete', auth().userRole == 'admin')` for admin-only write
- Auth context is extended in `apps/server/src/modules/zenstack/index.ts`
- Type definition in `schema.zmodel` under `type Auth { ... @@auth }`

### Route Protection
- Use `beforeLoad` in route definition for auth checks
- Pattern: `beforeLoad: async () => { const session = await authClient.getSession(); if (!condition) { throw redirect({ to: "/" }); } }`

### URL State Sync for Tables
- Use `useTableUrlState` hook from `~/hooks/use-table-url-state`
- Provides: `globalFilter`, `columnFilters`, `pagination` with URL sync
- Pass to TanStack Table: `onPaginationChange`, `onGlobalFilterChange`, `onColumnFiltersChange`

---

## Completed Stories

### US-001 - Organization Management (Completed)
**Date:** 2026-01-20

**What was implemented:**
- Extended Organization model with: cnpj, address, city, state, zipCode, contactName, contactEmail, contactPhone, active
- ZenStack access policies for global admin only (user.role='admin')
- Complete organizations admin UI at `/admin/organizations`
- Route protection with admin role check
- Sidebar navigation under "Administração" section

**Key Learnings:**
1. **Global vs Organization Roles:** The `userRole` in Auth context comes from `User.role` field (global admin), NOT from `Member.role` (organization-scoped role). Important distinction for multi-tenant systems.

2. **Edit Tool and Tabs:** The Edit tool can have issues matching strings in files that use tabs for indentation. When this happens, use the Write tool to rewrite the entire file instead.

3. **Pre-existing Type Errors:** The codebase has some pre-existing typecheck errors in form/table patterns (e.g., error mapping with `key={error?.message}`). These are systemic and not introduced by new features.

4. **ZenStack Generate:** Always run `pnpm run db:generate` from the server workspace after schema changes to regenerate the TypeScript types.

**Files Created:**
- `apps/web/src/features/organizations/` (entire folder)
- `apps/web/src/routes/_authenticated/admin/organizations/index.tsx`

**Files Modified:**
- `packages/zen-v3/schema.zmodel` (Organization model + Auth type)
- `apps/server/src/modules/zenstack/index.ts` (pass userRole to context)
- `apps/web/src/components/layout/data/sidebar-data.ts` (add admin nav)

---

## ✓ Iteration 1 - US-001: Organization Management
*2026-01-20T18:30:07.950Z (606s)*

**Status:** Completed

**Notes:**
with: Name, CNPJ (tax ID), address, primary contact\n   - Each organization is isolated (multi-tenant)\n   - Global Admin can activate/deactivate organizations\n   - Only users with the 'role' field on the User model (global admin) can create and manage organizations\n\n2. **Workflow specified**:\n   - Study PRD context\n   - Study `.ralph-tui/progress.md`\n   - Implement the story\n   - Run quality checks\n   - Commit with specific message\n   - Document learnings\n   - Signal completion with `

---

## 2026-01-20 - US-002 - Consumer Units CRUD
- What was implemented:
  - Extended GasUnit model with address fields (address, city, state, zipCode), responsible emails (as String[]), and contract linkage (GasContract relation)
  - Complete consumer-units feature with full CRUD:
    - Provider with dialog state management
    - Data table with URL-synced filtering/pagination
    - Form with email array management (add/remove)
    - Sheet/drawer for create/update operations
    - Confirmation dialogs for delete and status toggle
  - ElysiaJS endpoint `/gas/consumer-units/:unitId/can-delete` for validating delete operations (checking pending schedules)
  - Route at `/gas/consumer-units`
  - Sidebar navigation under "Gás > Unidades Consumidoras"

- Files changed:
  - `packages/zen-v3/schema.zmodel` - Added fields to GasUnit, added units relation to GasContract
  - `packages/zen-v3/src/zenstack/schema.ts` - Regenerated types
  - `apps/server/src/modules/gas/gas.controller.ts` - Added can-delete endpoint
  - `apps/web/src/components/layout/data/sidebar-data.ts` - Added nav item
  - `apps/web/src/features/consumer-units/` - Complete feature folder
  - `apps/web/src/routes/_authenticated/gas/consumer-units/index.tsx` - Route definition

- **Learnings:**
  - **String Array Fields:** ZenStack supports `String[]` for storing arrays like email lists. Used for `responsibleEmails` field.
  - **Email Array UI Pattern:** Created a reusable pattern for managing email arrays in forms with add/remove functionality and Enter key support.
  - **Delete Validation:** Use Elysia endpoint for complex validation logic (checking related records) before allowing delete. Call this from the frontend before ZenStack delete mutation.
  - **GasContract Relation:** When adding relations between existing models, remember to add the reverse relation (e.g., `units GasUnit[]` on GasContract).
  - **ZenStack Generate Location:** Run `pnpm -F @acme/zen-v3 db:generate` (not from root).

---
## ✓ Iteration 2 - US-002: Consumer Units CRUD
*2026-01-20T18:38:14.648Z (486s)*

**Status:** Completed

**Notes:**
ering point - ✅ The `code` field serves as the meter code identifier\n- [x] Use ZenStack v3 TanStack Query on frontend - ✅ Using `useClientQueries(schema)` from `@zenstackhq/tanstack-query/react`\n- [x] ElysiaJS endpoints with Kysely for complex operations - ✅ Created `/gas/consumer-units/:unitId/can-delete` endpoint \n- [x] Validation: do not allow deletion of units with pending schedules - ✅ The can-delete endpoint checks for pending `gasDailyPlan` and current month `gasDailyEntry` records\n\n

---

## 2026-01-20 - US-004 - Manual Contract Registration

**What was implemented:**
- Extended GasContract model with 30+ fields organized by sections:
  - **Basic data:** name, contractNumber, supplier, supplierCnpj
  - **Volumes and flexibilities:** qdcContracted, volumeUnit, transport tolerances, molecule tolerance, take-or-pay (percent, accumulation months, expiration), make-up gas (enabled, expiration, max percent), flexibility (up/down percent), seasonal flexibility
  - **Prices and adjustments:** basePricePerUnit, priceCurrency, adjustmentIndex, adjustmentFrequency, adjustmentBaseDate, nextAdjustmentDate, transportCostPerUnit, taxesIncluded
  - **Penalties:** penaltyForUnderConsumption, penaltyForOverConsumption, penaltyCalculationMethod, latePaymentPenaltyPercent, latePaymentInterestPercent
  - **Important events/dates:** effectiveFrom, effectiveTo, renewalDate, renewalNoticeDays, dailySchedulingDeadline, monthlyDeclarationDeadline
- Created GasContractAuditLog model for change history tracking (action, field, oldValue, newValue, userId, userName)
- Complete contracts feature folder following established patterns
- Route at `/gas/contracts`
- Sidebar navigation under "Gás > Contratos"

**Files Created:**
- `apps/web/src/features/contracts/` (entire folder with all components)
- `apps/web/src/routes/_authenticated/gas/contracts/index.tsx`

**Files Modified:**
- `packages/zen-v3/schema.zmodel` (GasContract fields + GasContractAuditLog model)
- `apps/web/src/components/layout/data/sidebar-data.ts` (add nav item)

**Key Learnings:**

1. **Audit Log Pattern:** Created a separate model (`GasContractAuditLog`) for tracking changes. Fields: action (create/update/delete), field (which field changed), oldValue, newValue, userId, userName, createdAt. Used `onDelete: Cascade` on the relation to auto-delete logs when contract is deleted.

2. **Auth Client Import:** In this codebase, the auth client is imported as `authClient` from `~/clients/auth-client` and session is retrieved via `authClient.useSession()`, NOT `useAuth()`.

3. **Multi-Select Unit Linkage:** The contract form includes a section to link multiple consumer units. This uses a checkbox list pattern where units without existing contracts are shown as available, and currently linked units are pre-checked.

4. **Unit-Contract Relationship:** The GasUnit model has a `contractId` foreign key, not a many-to-many. When linking units in the contract form, we update each unit's `contractId` field directly using the `updateUnit` mutation.

5. **Form Sections with Collapsible Pattern:** Large forms can be organized into sections. Used a simple approach with div containers and headings rather than collapsible UI components to keep the form accessible and scannable.

6. **History Dialog Pattern:** Added a "view-history" dialog type to the provider for displaying audit logs in a table format with formatted dates, user names, and truncated values with hover titles for long text.

---
## ✓ Iteration 3 - US-004: Manual Contract Registration
*2026-01-20T18:51:53.275Z (818s)*

**Status:** Completed

**Notes:**
rn by studying existing code\n\n6. All user messages:\n   - Initial task assignment message with full context including codebase patterns, US-004 requirements, acceptance criteria, prerequisites (US-001), recent progress from US-001 and US-002, and workflow instructions\n\n7. Pending Tasks:\n   - Complete quality checks (lint is in progress)\n   - Commit with message: `feat: US-004 - Manual Contract Registration`\n   - Document learnings in `.ralph-tui/progress.md`\n   - Signal completion with `

---

## 2026-01-20 - US-007 - Daily Consumption Scheduling by Unit

**What was implemented:**
- Complete daily-scheduling feature for registering daily gas volume schedules (QDP - Quantidade Diária Programada)
- Form with contract limit validation showing:
  - QDC Contratada (contracted daily quantity)
  - Minimum allowed (QDC - lower tolerance %)
  - Maximum allowed (QDC + upper tolerance %)
  - Real-time warning when volume is outside contract limits
- Submit to distributor workflow that marks records as submitted with timestamp and submitting user
- Table with filtering by status (pending/submitted) and search by unit name, code, or contract name
- Row actions: Edit, Submit to Distributor, Delete (disabled for submitted records)

**Files Created:**
- `apps/web/src/features/daily-scheduling/` (entire folder):
  - `components/daily-scheduling-provider.tsx` - Context provider for dialog state
  - `components/daily-scheduling-form.tsx` - Form with contract limit validation
  - `components/daily-scheduling-table.tsx` - Data table with URL-synced state
  - `components/daily-scheduling-columns.tsx` - TanStack Table column definitions
  - `components/daily-scheduling-dialogs.tsx` - Delete and submit-to-distributor dialogs
  - `components/daily-scheduling-mutate-drawer.tsx` - Sheet for create/update
  - `components/daily-scheduling-primary-buttons.tsx` - Primary action buttons
  - `components/data-table-row-actions.tsx` - Row action dropdown menu
  - `data/data.tsx` - Static data (submission statuses)
  - `index.tsx` - Main feature component
- `apps/web/src/routes/_authenticated/gas/scheduling/index.tsx` - Route definition

**Files Modified:**
- `apps/web/src/components/layout/data/sidebar-data.ts` - Added "Programação Diária" nav item

**Key Learnings:**

1. **ZenStack Mutations via useClientQueries:** The `useClientMutations` hook doesn't exist. Instead, use `useClientQueries(schema)` which provides both query hooks (`useFindMany`, etc.) AND mutation hooks (`useCreate`, `useUpdate`, `useDelete`).

2. **TanStack Form Local State Pattern:** When you need to trigger re-renders based on form field changes (e.g., to show validation messages), use React `useState` alongside the form. The `form.useStore` API doesn't exist in the current version. Track the values you need for side effects (like contract limit validation) in separate state variables.

3. **Route API Type Error for New Routes:** When creating a new route, the `getRouteApi("/_authenticated/gas/scheduling/")` call will cause a TypeScript error because the route isn't registered until the next build. Use `@ts-expect-error` comment and wrap in try/catch for graceful fallback:
   ```tsx
   try {
     // @ts-expect-error - Route may not be registered yet during initial build
     const route = getRouteApi("/_authenticated/gas/scheduling/");
     search = route.useSearch() as Record<string, unknown>;
     navigate = route.useNavigate() as unknown as NavigateFn;
   } catch {
     // Route not registered yet - use fallback
   }
   ```

4. **Contract Limit Validation Pattern:** For volume validation against contract limits:
   - `maxAllowed = qdcContracted * (1 + upperTolerance / 100)`
   - `minAllowed = qdcContracted * (1 - lowerTolerance / 100)`
   - Show warnings but still allow saving (penalties may apply)

5. **Submit Workflow Pattern:** For two-stage workflows (draft → submitted):
   - Use a boolean `submitted` field on the model
   - Track `submittedAt` timestamp and `submittedById` user reference
   - Disable edit/delete actions for submitted records
   - Use a confirmation dialog before submission

---
## ✓ Iteration 4 - US-007: Daily Consumption Scheduling by Unit
*2026-01-20*

**Status:** Completed

---
## ✓ Iteration 4 - US-007: Daily Consumption Scheduling by Unit
*2026-01-20T19:03:51.717Z (717s)*

**Status:** Completed

**Notes:**
ll user messages:\n   - Initial task assignment with full context including:\n     - Codebase Patterns (Feature Structure, ZenStack Access Policies, Route Protection, URL State Sync)\n     - Task: US-007 - Daily Consumption Scheduling by Unit\n     - Acceptance Criteria (5 items)\n     - Prerequisites: US-002, US-004\n     - Recent Progress from previous iterations\n     - Workflow instructions (7 steps)\n     - Learnings documentation requirement\n     - Stop Condition: Signal completion with `

---

## 2026-01-20 - US-008 - Daily Scheduling Dashboard

**What was implemented:**
- Complete scheduling-dashboard feature for contract managers to view unit scheduling status
- Current day view with date navigation (previous day, next day, calendar picker, "today" button)
- List of all organization units with scheduling status per unit:
  - **Scheduled** (green): Unit has a daily plan for the selected date
  - **Pending** (yellow): No plan yet, but deadline hasn't passed (for today) or it's a future date
  - **Late** (red): Past date with no plan, or today's date past the contract deadline
- Summary cards showing total, scheduled, pending, and late unit counts
- Filters by contract (dropdown), unit/code (search), status
- Visual highlight for pending/late units (row background color)
- Quick action button to navigate to scheduling page for units without schedules

**Files Created:**
- `apps/web/src/features/scheduling-dashboard/` (entire folder):
  - `components/scheduling-dashboard-provider.tsx` - Context provider for selected date state
  - `components/scheduling-dashboard-date-picker.tsx` - Date navigation component with prev/next/calendar/today
  - `components/scheduling-dashboard-table.tsx` - Main table with computed unit statuses and summary cards
  - `components/scheduling-dashboard-columns.tsx` - TanStack Table column definitions with status badges
  - `data/data.tsx` - Static data for scheduling statuses
  - `index.tsx` - Main feature component
- `apps/web/src/routes/_authenticated/gas/scheduling-dashboard/index.tsx` - Route definition with search schema

**Files Modified:**
- `apps/web/src/components/layout/data/sidebar-data.ts` - Added "Painel de Programação" nav item with ClipboardList icon

**Key Learnings:**

1. **Computed Status from Multiple Data Sources:** The dashboard computes unit scheduling status by cross-referencing two queries: all active units (`gasUnit`) and daily plans (`gasDailyPlan`) for the selected date. Status is computed client-side using `useMemo` rather than creating a new API endpoint.

2. **Date-Based Status Logic Pattern:**
   - Check if selected date is today, in the past, or in the future
   - For past dates: no plan = "late"
   - For today: check contract's `dailySchedulingDeadline` time to determine if still "pending" or "late"
   - For future dates: no plan = "pending" (can't be late yet)

3. **Date Picker Component Pattern:** Created a date picker with navigation controls (prev/next day buttons + calendar popover + "today" shortcut). Used date-fns for date manipulation and ptBR locale for Portuguese formatting.

4. **Summary Cards Pattern:** Added summary cards above the table showing counts by status. Used color-coded cards with border and background matching the status colors (green/yellow/red).

5. **Row Highlighting by Status:** Applied conditional row background colors using `cn()` utility based on row status. Used subtle transparency for dark mode support (e.g., `bg-yellow-50/50 dark:bg-yellow-900/10`).

6. **Navigation Without Router Context:** For navigation from within column cell renderers (which are outside React Router context), used `window.location.href` instead of TanStack Router's `Link` component to avoid type errors with unregistered routes.

---
## ✓ Iteration 5 - US-008: Daily Scheduling Dashboard
*2026-01-20T19:09:50.973Z (358s)*

**Status:** Completed

**Notes:**
rification:**\n- [x] Current day view - Date picker defaults to current day with navigation controls\n- [x] List of all organization units - Table shows all active units from the organization\n- [x] Status per unit: Scheduled | Pending | Late - Status computed based on plan existence and deadline logic\n- [x] Filters by contract, unit, status - DataTableToolbar with search and faceted filters\n- [x] Visual highlight for pending units - Row backgrounds colored yellow for pending, red for late\n\n

---

## 2026-01-20 - US-013 - User Management by Organization

**What was implemented:**
- Extended Member model with SS-GAS specific profile field (admin, manager, operator, viewer)
- Added soft delete support via `deactivatedAt` and `deactivatedById` fields on Member
- Created `GasUnitOperator` join model for linking operators to specific consumer units
- Updated users feature to fetch members via ZenStack with user relation
- Integrated with better-auth `organization.inviteMember` for sending invitations
- Complete set of user management dialogs:
  - Edit profile dialog for changing access profiles
  - Deactivate/Reactivate dialogs for soft delete operations
  - Unit assignment dialog for linking operators to consumer units
- Updated data table with profile and role filters
- Updated column definitions for Member type display

**Files Created:**
- `apps/web/src/features/users/components/users-edit-profile-dialog.tsx` - Edit user profile
- `apps/web/src/features/users/components/users-deactivate-dialog.tsx` - Soft delete user
- `apps/web/src/features/users/components/users-reactivate-dialog.tsx` - Reactivate user
- `apps/web/src/features/users/components/users-assign-units-dialog.tsx` - Operator-unit linkage

**Files Modified:**
- `packages/zen-v3/schema.zmodel` - Added GasUserProfile enum, extended Member model, created GasUnitOperator model
- `apps/web/src/features/users/data/data.ts` - Added profiles and roles arrays
- `apps/web/src/features/users/data/schema.ts` - Updated Member and Invitation types
- `apps/web/src/features/users/components/users-provider.tsx` - Added new dialog types and member state
- `apps/web/src/features/users/components/users-table.tsx` - ZenStack-based member fetching
- `apps/web/src/features/users/components/users-columns.tsx` - Column definitions for Member type
- `apps/web/src/features/users/components/users-dialogs.tsx` - Integrated all new dialogs
- `apps/web/src/features/users/components/users-invite-dialog.tsx` - better-auth integration
- `apps/web/src/features/users/components/data-table-row-actions.tsx` - New row actions
- `apps/web/src/features/users/components/users-primary-buttons.tsx` - Invite button
- `apps/web/src/features/users/index.tsx` - Updated layout

**Key Learnings:**

1. **Better-Auth vs ZenStack for Members:** Better-auth manages the core member/invitation data, but ZenStack is used for custom profile fields and extended member data. The pattern is to use ZenStack's `member.useFindMany()` with `include: { user: true }` to get members with their user data directly, avoiding the need to merge data from multiple sources.

2. **Profile Enum Pattern:** Created a `GasUserProfile` enum (admin, manager, operator, viewer) separate from better-auth's organization roles (owner, admin, member). The SS-GAS profile controls feature access while the better-auth role controls organization-level permissions.

3. **Soft Delete Pattern:** Used `deactivatedAt` timestamp field instead of a boolean `isActive` field. This preserves the deactivation date and allows tracking who deactivated the user via `deactivatedById`. Reactivation sets both fields to null.

4. **Operator-Unit Linkage:** Created a `GasUnitOperator` join model for many-to-many relationship between members and units. This allows operators to be assigned to multiple units and units to have multiple operators. The join table includes `createdAt`, `createdById`, and optional `notes` fields.

5. **Zod Enum in Newer Versions:** The `required_error` parameter doesn't exist in zod v4/newer versions. Use `message` instead: `z.enum(['a', 'b'] as const, { message: "Required" })`.

6. **TanStack Table ColumnMeta Typing:** The ColumnMeta type doesn't include `className`, `thClassName`, `tdClassName` by default. Cast to the expected type: `(header.column.columnDef.meta as { className?: string })?.className`.

7. **ZenStack Relation Include:** To fetch related data (like user from member), use `include: { user: true }` in the query options, not `select` for the relation.

---
## ✓ Iteration 6 - US-013: User Management by Organization
*2026-01-20*

**Status:** Completed

**Notes:**
Implemented complete user management feature for organizations with profile assignment, soft delete, and operator-unit linkage capabilities.

---
## ✓ Iteration 6 - US-013: User Management by Organization
*2026-01-20T19:25:35.722Z (944s)*

**Status:** Completed

**Notes:**
-unit linkage using a join model (GasUnitOperator) with many-to-many relationship\n\n6. All user messages:\n   - Initial task assignment message with full context including codebase patterns, US-013 requirements, acceptance criteria (user invitation by email, profile assignment, operator-unit linkage, soft delete), prerequisites (US-001), recent progress from previous iterations, and workflow instructions (study PRD, implement, quality checks, commit, document learnings, signal completion with `

---

## 2026-01-20 - US-003 - Contract Upload and AI Extraction

**What was implemented:**
- Contract upload with AI-powered data extraction using Anthropic Claude
- Backend changes:
  - New `contracts` route in better-upload plugin for PDF/image upload to Cloudflare R2
  - New `contract-extraction` Elysia module with `/extract` endpoint
  - AI extraction system prompt for Brazilian gas contracts covering 30+ fields
- Frontend changes:
  - `ContractUploadDrawer` - Full-width sheet with side-by-side layout:
    - Left side: PDF viewer with pagination (react-pdf) or image preview
    - Right side: Extracted data form with confidence indicators
  - `ContractExtractionForm` - Form displaying all extracted fields with:
    - Confidence badges (percentage display)
    - Yellow highlighting for low confidence fields (<70%)
    - Tooltips showing source text where available
    - Unit selection for linking to consumer units
- Integrated "Upload com IA" button in contracts primary buttons

**Files Created:**
- `apps/server/src/modules/contract-extraction/contract-extraction.controller.ts`
- `apps/server/src/modules/contract-extraction/index.ts`
- `apps/web/src/features/contracts/components/contract-upload-drawer.tsx`
- `apps/web/src/features/contracts/components/contract-extraction-form.tsx`

**Files Modified:**
- `apps/server/src/index.ts` - Registered contractExtractionController
- `apps/server/src/plugins/better-upload.ts` - Added contracts upload route
- `apps/server/package.json` - Added @anthropic-ai/sdk dependency
- `apps/web/package.json` - Added react-pdf dependency
- `apps/web/src/features/contracts/components/contracts-dialogs.tsx` - Added upload drawer
- `apps/web/src/features/contracts/components/contracts-primary-buttons.tsx` - Added upload button
- `apps/web/src/features/contracts/components/contracts-provider.tsx` - Added "upload" dialog type

**Key Learnings:**

1. **Anthropic Document API:** For PDFs, use `type: "document"` with `source: { type: "base64", media_type: "application/pdf", data: base64String }`. For images, use `type: "image"` with the appropriate media type.

2. **Structured AI Extraction:** Use a comprehensive system prompt that defines all fields to extract, their expected formats, and confidence scoring guidelines. Ask the AI to return pure JSON for easy parsing.

3. **Confidence Scoring Pattern:** Each extracted field includes `value`, `confidence` (0-1), and optional `source` (text excerpt). The frontend uses a threshold (70%) to highlight fields needing review.

4. **Side-by-Side Layout Pattern:** Used a full-width Sheet (`sm:max-w-[95vw] lg:max-w-[90vw]`) with two columns. Left column shows the document, right column shows the form. Both columns have independent scroll areas.

5. **react-pdf Configuration:** Must set the PDF.js worker URL: `pdfjs.GlobalWorkerOptions.workerSrc = \`//unpkg.com/pdfjs-dist@\${pdfjs.version}/build/pdf.worker.min.mjs\``. Import annotation and text layer CSS for proper rendering.

6. **Eden Treaty API Client:** The api client exports `api`, not `apiClient`. Access nested routes with bracket notation: `api["contract-extraction"].extract.post({...})`.

7. **better-upload multipleFiles:** Even for single file upload, use `multipleFiles: true` with `maxFiles: 1` to match the expected return type of the hook.

8. **Form Default Values from Extracted Data:** Created helper functions `getFieldValue()` and `getConfidence()` to safely extract values and confidence scores from the AI response, with sensible defaults.

---
## ✓ Iteration 7 - US-003: Contract Upload and AI Extraction
*2026-01-20T19:39:16.253Z (819s)*

**Status:** Completed

---

## 2026-01-20 - US-005 - Deadline Alert Configuration

**What was implemented:**
- Complete alert configuration system for important contract dates
- Database models:
  - `GasContractAlert` - Main alert configuration with event type, name, description, date, recurrence, and advance notice settings
  - `GasContractAlertRecipient` - Email recipients for each alert (many-to-one with alerts)
  - `GasAlertSentLog` - History of sent alerts for tracking/auditing
  - `GasAlertEventType` enum with default events: contract_expiration, renewal_deadline, daily_scheduling, monthly_declaration, adjustment_date, take_or_pay_expiration, make_up_gas_expiration, custom
  - `GasAlertRecurrence` enum: once, daily, weekly, monthly, yearly
- Frontend contract-alerts feature with:
  - Provider for dialog state management
  - Data table with URL-synced filtering (by status, event type) and search
  - Form with contract selection, event type, date/time, recurrence, advance notice (multi-select checkboxes), and email recipients
  - Sheet/drawer for create/update operations
  - Confirmation dialogs for delete and toggle active
  - Row actions dropdown

**Files Created:**
- `apps/web/src/features/contract-alerts/` (entire folder):
  - `components/contract-alert-form.tsx` - Form with email array, advance notice checkboxes
  - `components/contract-alerts-columns.tsx` - TanStack Table columns with type labels
  - `components/contract-alerts-dialogs.tsx` - Delete and toggle-active dialogs
  - `components/contract-alerts-mutate-drawer.tsx` - Sheet for create/update
  - `components/contract-alerts-primary-buttons.tsx` - "Novo Alerta" button
  - `components/contract-alerts-provider.tsx` - Context provider with relations type
  - `components/contract-alerts-table.tsx` - Data table with filters
  - `components/data-table-row-actions.tsx` - Row action dropdown menu
  - `data/data.tsx` - Static data (event types, recurrence options, statuses, default advance days)
  - `index.tsx` - Main feature component
- `apps/web/src/routes/_authenticated/gas/contract-alerts/index.tsx` - Route definition

**Files Modified:**
- `packages/zen-v3/schema.zmodel` - Added alert models and enums, added `alerts` relation to GasContract
- `apps/web/src/components/layout/data/sidebar-data.ts` - Added "Alertas" nav item with BellRing icon

**Key Learnings:**

1. **ZenStack Relations with Types:** When using ZenStack queries with `include: { relation: true }`, the base model type doesn't automatically include the relation types. Create a union type:
   ```tsx
   type GasContractAlertWithRelations = GasContractAlert & {
     contract?: GasContract | null;
     recipients?: GasContractAlertRecipient[];
   };
   ```

2. **PostgreSQL Int Array:** ZenStack supports `Int[]` for storing arrays of integers, useful for the `advanceNoticeDays` field (e.g., `[30, 15, 7, 1]`).

3. **Enum for Event Types Pattern:** Created a comprehensive enum for default event types that map to contract fields. The "custom" type allows users to define their own events with custom dates.

4. **Checkbox Multi-Select Pattern:** For advance notice days, used a checkbox pattern where clicking toggles the day in/out of the array. Sorted the array descending for display.

5. **Route Registration ts-expect-error:** For new routes, the route file must exist before `getRouteApi()` can find it. Use `// @ts-expect-error - Route will be registered after build` to suppress the type error during initial development.

6. **Recipients as Separate Model:** Rather than storing emails as `String[]` on the alert, created a separate `GasContractAlertRecipient` model with unique constraint on `[alertId, email]`. This allows better tracking and future extensions (e.g., notification preferences per recipient).

---
## ✓ Iteration 8 - US-005: Deadline Alert Configuration
*2026-01-20T19:51:49.688Z (752s)*

**Status:** Completed

**Notes:**
es (emails) per alert** - Created `GasContractAlertRecipient` model for email recipients with unique constraint on `[alertId, email]` and UI for managing email recipients\n\n**Summary of implementation:**\n- 3 new database models: `GasContractAlert`, `GasContractAlertRecipient`, `GasAlertSentLog`\n- 2 new enums: `GasAlertEventType`, `GasAlertRecurrence`\n- Complete contract-alerts feature with 10 component files\n- Route at `/gas/contract-alerts`\n- Navigation added to sidebar under Gás menu\n\n

---

## 2026-01-20 - US-006 - Reminder Email Dispatch

**What was implemented:**
- Automatic email dispatch system for contract alert notifications
- Email template (ContractAlertEmail) with:
  - Contract name, unit name (if applicable)
  - Event name and description
  - Event date and advance notice (highlighting urgent items)
  - Required action based on event type
  - Direct link to contract in the system
- Alert processing service (ContractAlertService) with:
  - Due alert detection based on advance notice days
  - Recurring event calculation (next occurrence for daily/weekly/monthly/yearly)
  - Individual email per event (1 alert = 1 email per recipient)
  - Sent log recording with status (sent/failed) and error messages
- Scheduled job at 9 AM daily (America/Sao_Paulo timezone)
- API endpoints:
  - GET `/gas/alerts/:alertId/sent-logs` - Retrieve sent email history for an alert
  - POST `/gas/alerts/process` - Manual trigger for alert processing (admin/owner only)
- UI: History dialog showing email dispatch log with date, recipient, status, advance notice days, and error messages

**Files Created:**
- `packages/email/src/emails/ContractAlertEmail.tsx` - Email template component
- `apps/server/src/services/contract-alert.service.ts` - Alert processing service
- `apps/web/src/features/contract-alerts/components/contract-alerts-history-dialog.tsx` - View history dialog

**Files Modified:**
- `packages/email/src/emails/index.ts` - Export ContractAlertEmail
- `packages/email/package.json` - Fix build script to specify emails directory
- `apps/server/src/services/index.ts` - Export ContractAlertService
- `apps/server/src/plugins/scheduled-jobs.ts` - Added processContractAlerts job
- `apps/server/src/modules/gas/gas.controller.ts` - Added sent-logs and process endpoints
- `apps/web/src/features/contract-alerts/components/contract-alerts-dialogs.tsx` - Integrated history dialog
- `apps/web/src/features/contract-alerts/components/data-table-row-actions.tsx` - Added "Ver Histórico" action

**Key Learnings:**

1. **Better-Auth Session vs Organization Role:** The session object from betterAuth macro returns `session` (raw session data), `user`, and `organizationRole` separately. Access organization role via `organizationRole`, not `session.activeOrganizationRole`.

2. **React-Email Template Pattern:** Use `@react-email/components` for email components (Html, Text, Container, Section, Hr, Heading). Import TailwindProvider for Tailwind CSS classes. The email template receives props and returns JSX.

3. **Recurring Event Calculation:** For recurring alerts, calculate the next occurrence by advancing the base date until it's in the future. Use the advance notice days array to determine when to send (e.g., [30, 15, 7, 1] means send 30, 15, 7, and 1 days before the event).

4. **Sent Log Deduplication:** Before sending an alert, check if it was already sent today for the same advance period to avoid duplicate emails. Query by `alertId`, `advanceNoticeDays`, and `sentAt` range (today to tomorrow).

5. **Event Type Action Mapping:** Create a mapping object (`eventTypeActions`) that maps event types to human-readable required actions. This makes the email content more helpful and actionable.

6. **Email Package Build Config:** The `react-email build` command needs `--dir ./src/emails` to find the email templates. Update package.json scripts to include the directory flag.

---
## ✓ Iteration 9 - US-006: Reminder Email Dispatch
*2026-01-20T20:03:09.531Z (679s)*

**Status:** Completed

**Notes:**
ria Verification:**\n- [x] Individual email per event (1 alert = 1 email) - The service sends one email per recipient per alert\n- [x] Template with: contract name, unit, event, date, required action - ContractAlertEmail includes all these fields\n- [x] Direct link to contract/unit in the system - The email includes a contractLink that points to the contract alerts page\n- [x] Log of sent emails (date, recipient, status) - GasAlertSentLog model stores this, and the history dialog displays it\n\n

---
## ✗ Iteration 10 - US-009: Actual Consumption Recording
*2026-01-20T20:12:04.436Z (534s)*

**Status:** Failed/Incomplete

---
## ✗ Iteration 11 - US-012: Administrative Parameter Panel
*2026-01-20T20:12:12.141Z (7s)*

**Status:** Failed/Incomplete

---
## ✗ Iteration 12 - US-014: History and Audit Log
*2026-01-20T20:12:18.843Z (6s)*

**Status:** Failed/Incomplete

---
