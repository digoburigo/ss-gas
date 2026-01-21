# Ralph Progress Log

This file tracks progress across iterations. It's automatically updated
after each iteration and included in agent prompts for context.

## Codebase Patterns (Study These First)

### ZenStack v3 TanStack Query Pattern
```tsx
import { schema } from "@acme/zen-v3/zenstack/schema";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

const client = useClientQueries(schema);
const { data } = client.model.useFindMany({
  where: { active: true },
  include: { relatedModel: true },
  orderBy: { name: "asc" },
});
```

### Feature Module Structure
Each feature follows this structure:
```
features/<feature-name>/
├── index.tsx              # Main component with page layout
├── data/data.tsx          # Constants, enums, filter options
├── components/
│   ├── <feature>-form.tsx           # TanStack Form with validation
│   ├── <feature>-table.tsx          # DataTable with URL-synced filters
│   ├── <feature>-columns.tsx        # Column definitions
│   ├── <feature>-dialogs.tsx        # Delete confirmation, etc.
│   ├── <feature>-mutate-drawer.tsx  # Create/Edit sheet
│   ├── <feature>-provider.tsx       # Context for selected item state
│   └── data-table-row-actions.tsx   # Row action buttons
```

### Deviation Calculation Pattern
For comparing scheduled vs actual values:
```tsx
const deviation = scheduledVolume > 0 ? actualVolume - scheduledVolume : 0;
const deviationPercent = scheduledVolume > 0 ? (deviation / scheduledVolume) * 100 : 0;
const isWithinLimit = Math.abs(deviationPercent) <= 10; // ±10% threshold
```

### Accuracy Rate Calculation Pattern
For calculating scheduling accuracy (1 - deviation ratio):
```tsx
// Formula: (1 - |Scheduled - Actual| / Scheduled) x 100%
function calculateAccuracyRate(scheduled: number, actual: number): number {
  if (scheduled <= 0) return 0;
  const deviation = Math.abs(scheduled - actual);
  const accuracy = (1 - deviation / scheduled) * 100;
  return Math.max(0, accuracy); // Ensure non-negative
}
```

### Period Aggregation Pattern
For grouping data by week/month with accuracy averaging:
```tsx
// Weekly: Use Monday of each week as key
const day = date.getDay();
const diff = date.getDate() - day + (day === 0 ? -6 : 1);
const monday = new Date(date);
monday.setDate(diff);
const weekKey = monday.toISOString().split("T")[0] ?? "";

// Monthly: Use YYYY-MM format
const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
```

---

## 2026-01-20 - US-009
- **What was implemented**: Actual consumption recording feature for Unit Operators
- **Files changed**:
  - `apps/web/src/features/actual-consumption/` - New feature module (12 files)
  - `apps/web/src/components/layout/data/sidebar-data.ts` - Added navigation link
  - `apps/web/src/routes/_auth/gas/actual-consumption/index.tsx` - Route page
- **Key features**:
  - Manual input of consumed volume (QDR measurement)
  - Reading date with automatic deviation calculation
  - Support for multiple measurement sources (meter, manual, calculated)
  - Meter reading fields with automatic volume calculation
  - Real-time deviation display comparing scheduled (QDP) vs actual (QDR)
  - Visual indicators for deviation severity (±10% threshold)
  - Filter by source type and deviation status
- **Learnings:**
  - Pattern: Use `useFindFirst` with date filter to fetch corresponding schedule for a consumption record
  - Gotcha: Date comparisons need UTC timezone handling (`toISOString().split("T")[0]`)
  - Pattern: Meter reading calculation happens in `useEffect` watching source and meter values
---

## ✓ Iteration 1 - US-009: Actual Consumption Recording
*2026-01-20T22:04:53.445Z (179s)*

**Status:** Completed

**Notes:**
heduled vs actual) | ✅ | Real-time deviation calculation with visual indicators (±10% threshold) |\n\n### Files Implemented:\n- `apps/web/src/features/actual-consumption/` - 12 component files\n- `apps/web/src/routes/_auth/gas/actual-consumption/index.tsx` - Route page\n- `apps/web/src/components/layout/data/sidebar-data.ts` - Navigation link\n\n### Documentation Updated:\n- `.ralph-tui/progress.md` - Added learnings and codebase patterns\n- `tasks/prd.json` - Marked US-009 as `passes: true`\n\n

---

### ZenStack v3 Mutations Pattern
```tsx
import { schema } from "@acme/zen-v3/zenstack/schema";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

const client = useClientQueries(schema);

// CORRECT: Use mutations directly on client model
const { mutate: createItem, isPending: isCreating } = client.model.useCreate({
  onSuccess: () => { toast.success("Created!"); refetch(); },
  onError: (error: Error) => { toast.error(error.message); },
});

// WRONG: useClientMutations does NOT exist in ZenStack v3
// const mutations = useClientMutations(schema); // ❌ This will cause TypeScript errors
```

---

## 2026-01-20 - US-010
- **What was implemented**: Scheduling Accuracy Rate feature for Contract Managers
- **Files changed**:
  - `apps/web/src/features/scheduling-accuracy/` - New feature module (9 files)
  - `apps/web/src/components/layout/data/sidebar-data.ts` - Added navigation link
  - `apps/web/src/routes/_authenticated/gas/scheduling-accuracy/index.tsx` - Route page
- **Key features**:
  - Accuracy calculation: (1 - |Scheduled - Actual| / Scheduled) x 100%
  - Summary cards with average accuracy, total records, within/outside tolerance counts
  - Period filters (daily, weekly, monthly) for deviation history
  - Unit filter to analyze specific consumer units
  - Date range picker with quick presets (this month, last month, last 3 months)
  - Trend charts showing accuracy evolution with scheduled vs actual bars
  - Deviation history table with sortable columns
  - Cause analysis dialog to record reasons for deviations
  - Cause distribution pie chart for pattern analysis
  - Deviation causes: weather, production, maintenance, demand changes, etc.
  - Accuracy thresholds: excellent (≥95%), good (≥90%), acceptable (≥80%), poor (<80%)
- **Learnings:**
  - Pattern: Use ChartContainer with ChartConfig for consistent chart theming
  - Pattern: Aggregate data by period using Map for weekly/monthly groupings
  - Gotcha: Chart tooltip types have pre-existing compatibility issues - use same patterns as existing charts
  - Pattern: Use `?? ""` or `?? "default"` for array index access that might return undefined
  - Pattern: Consider contract tolerances from the linked contract for tolerance analysis
---
## ✓ Iteration 2 - US-010: Scheduling Accuracy Rate
*2026-01-20T22:14:39.608Z (585s)*

**Status:** Completed

**Notes:**
`accuracy-summary-cards.tsx` - KPI cards\n  - `accuracy-filters.tsx` - Period, unit, and date range filters\n  - `accuracy-trend-chart.tsx` - Trend visualization\n  - `accuracy-history-table.tsx` - Deviation history table\n  - `cause-analysis-dialog.tsx` - Record deviation causes\n  - `cause-distribution-chart.tsx` - Pie chart of causes\n- `apps/web/src/routes/_authenticated/gas/scheduling-accuracy/index.tsx` - Route\n- `apps/web/src/components/layout/data/sidebar-data.ts` - Navigation link\n\n

---

## 2026-01-20 - US-012
- **What was implemented**: Administrative Parameter Panel for Admin profile
- **Files changed**:
  - `packages/zen-v3/schema.zmodel` - Added 3 new models (GasSystemParameter, GasContractTemplate, GasCustomField)
  - `apps/web/src/features/admin-parameters/` - New feature module (9 files)
  - `apps/web/src/routes/_authenticated/gas/admin-parameters/index.tsx` - Route page with admin access control
  - `apps/web/src/components/layout/data/sidebar-data.ts` - Added navigation link
- **Key features**:
  - Alert thresholds configuration (deviation %, expiration advance notice)
  - Penalty formulas configuration (take-or-pay, fines, interest rates)
  - Business rules by contract type (tabs per contract type with overrides)
  - Contract templates with JSON configuration (default values for new contracts)
  - Custom fields per entity type (contract, consumer_unit)
  - Admin-only access via member profile/role check
- **Learnings:**
  - Gotcha: ZenStack v3 does NOT have `useClientMutations` - use mutations directly on `client.model.useCreate/useUpdate/useDelete`
  - Pattern: For admin-only access, check `member.profile === "admin" || member.role === "admin" || member.role === "owner"`
  - Pattern: Use `refetch()` in mutation callbacks to refresh data after CRUD operations
  - Pattern: Type error callbacks with `(error: Error)` to avoid implicit any
  - Pattern: Cast arrays for `.find()` callbacks: `(parameters as GasSystemParameter[]).find((p) => p.key === key)`
  - Gotcha: After adding new models to schema.zmodel, run `pnpm run --filter "@acme/zen-v3" db:generate` to regenerate types
---
## ✓ Iteration 3 - US-012: Administrative Parameter Panel
*2026-01-20T22:33:41.080Z (1140s)*

**Status:** Completed

---

## 2026-01-20 - US-011
- **What was implemented**: Scheduling Deviation Alerts system
- **Files changed**:
  - `packages/email/src/emails/DeviationAlertEmail.tsx` - New email template for deviation alerts
  - `apps/web/src/features/deviation-alerts/` - New feature module (8 files):
    - `index.tsx` - Main page with alert detection logic
    - `data/data.tsx` - Severity levels, status options, helper functions
    - `components/deviation-alerts-provider.tsx` - Context for filters and dialogs
    - `components/deviation-alerts-summary-cards.tsx` - KPI summary cards
    - `components/deviation-alerts-filters.tsx` - Date range, unit, status filters
    - `components/deviation-alerts-table.tsx` - Alerts table with severity coloring
    - `components/deviation-alert-indicator.tsx` - Dashboard indicator card
    - `components/send-email-dialog.tsx` - Dialog for sending alert emails
    - `components/acknowledge-dialog.tsx` - Dialog for acknowledging alerts
  - `apps/web/src/features/gas/index.tsx` - Added deviation alert indicator to dashboard
  - `apps/web/src/routes/_authenticated/gas/deviation-alerts/index.tsx` - Route page
  - `apps/web/src/components/layout/data/sidebar-data.ts` - Added navigation link
- **Key features**:
  - Configurable threshold from admin parameters (deviation_threshold_percent)
  - Automatic detection of deviations exceeding threshold
  - Severity levels: critical (≥30%), high (≥20%), medium (≥10%)
  - Visual indicator on gas dashboard showing active alert count
  - Alerts table with filtering by date range, unit, and status
  - Summary cards: total alerts, active alerts, over/under consumption counts, emails sent
  - Send email dialog with configurable recipients
  - Acknowledge dialog to mark alerts as reviewed
  - Color-coded rows based on alert severity
- **Learnings:**
  - Pattern: Use `useEffect` to sync admin parameter value to local state
  - Pattern: For imperative filtering (for...of loops), use explicit push to typed array instead of .map().filter()
  - Pattern: Import `cn` from `@acme/ui` not `@acme/ui/lib/utils`
  - Pattern: TanStack Router routes need Vite dev server to regenerate routeTree.gen.ts
---
## ✓ Iteration 4 - US-011: Scheduling Deviation Alerts
*2026-01-20T22:46:46.164Z (784s)*

**Status:** Completed

**Notes:**
stem only shows alerts and allows acknowledgment\n   - No automatic corrective action suggestions\n\n### Files Created:\n- `packages/email/src/emails/DeviationAlertEmail.tsx` - Email template\n- `apps/web/src/features/deviation-alerts/` - Full feature module (9 files)\n- `apps/web/src/routes/_authenticated/gas/deviation-alerts/index.tsx` - Route\n- Updated `apps/web/src/features/gas/index.tsx` - Dashboard indicator\n- Updated `apps/web/src/components/layout/data/sidebar-data.ts` - Navigation\n\n

---

## 2026-01-20 - US-014
- **What was implemented**: History and Audit Log feature for Admin profile
- **Files changed**:
  - `packages/zen-v3/schema.zmodel` - Added GasAuditLog model with AuditAction enum
  - `apps/web/src/features/audit-log/` - New feature module (8 files):
    - `index.tsx` - Main page with log fetching and filtering
    - `data/data.tsx` - Entity types, action types, export utilities
    - `components/audit-log-provider.tsx` - Context for filters and dialog state
    - `components/audit-log-filters.tsx` - Date range, entity, action, user filters
    - `components/audit-log-table.tsx` - Table with sortable columns and pagination
    - `components/audit-log-summary-cards.tsx` - KPI summary cards
    - `components/details-dialog.tsx` - Dialog for viewing log details
    - `components/export-dialog.tsx` - Dialog for exporting logs to CSV/JSON
  - `apps/web/src/routes/_authenticated/gas/audit-log/index.tsx` - Route page
  - `apps/web/src/components/layout/data/sidebar-data.ts` - Added navigation link
- **Key features**:
  - Log of all write operations (create, update, delete)
  - Record: user, date/time, entity type, entity name, changed field, previous value, new value
  - Entity types: contract, unit, plan, consumption, parameter, template, custom_field, alert, user, organization
  - Color-coded action badges: green for create, blue for update, red for delete
  - Filters by entity type, action type, user, period (date range)
  - Search by entity name, user name, or field name
  - Summary cards: total logs, creates, updates, deletes, unique users
  - Details dialog with full change information
  - Export to CSV or JSON format
  - Admin-only access via organization context
- **Learnings:**
  - Pattern: Use enum cast `as "create" | "update" | "delete"` for action filters with ZenStack
  - Pattern: Use `isJsonValue()` helper to detect and parse JSON values for display
  - Pattern: Export functions should create Blob and trigger download via temporary link
  - Pattern: For audit logs, store userName/userEmail directly to preserve history even if user is deleted
  - Gotcha: New routes require dev server to regenerate routeTree.gen.ts
  - Pattern: Use border-l-4 with color classes for visual action indicators in table rows
---
## ✓ Iteration 5 - US-014: History and Audit Log
*2026-01-20T22:58:22.491Z (695s)*

**Status:** Completed

**Notes:**
ers\n   - `components/audit-log-table.tsx` - Sortable table with pagination\n   - `components/audit-log-summary-cards.tsx` - KPI cards showing action counts\n   - `components/details-dialog.tsx` - View full change details\n   - `components/export-dialog.tsx` - Export to CSV/JSON\n   - `index.tsx` - Main page component\n\n3. **Route** (`apps/web/src/routes/_authenticated/gas/audit-log/index.tsx`)\n\n4. **Navigation** (`apps/web/src/components/layout/data/sidebar-data.ts`) - Added sidebar link\n\n

---
