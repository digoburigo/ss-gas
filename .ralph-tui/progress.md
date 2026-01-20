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
