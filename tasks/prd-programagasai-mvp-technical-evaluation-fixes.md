# PRD: Programagas.ai MVP Technical Evaluation Fixes

## Overview
This PRD addresses all findings from the technical evaluation conducted by Luiz Henrique Zim Alexandre (03/03/2026). It covers bug fixes for number display and calendar rules, UX improvements for navigation and admin icons, new features for bulk scheduling/consumption uploads, a dedicated penalties module with tariff management, contract versioning, reports investigation, and future-looking items like a Q&A chatbot and direct SCGas integration.

## Goals
- Fix visual bugs that impact daily operations (disproportionate numbers, calendar rules)
- Eliminate user confusion from overlapping navigation (Lançamento Diário vs Programação)
- Enable bulk data operations (monthly scheduling and consumption imports via Excel with AI interpretation)
- Provide dedicated penalties visibility with tariff history and approval workflow
- Improve reports reliability and empty states
- Enhance admin parameter icons for clarity
- Improve contract template UX with versioning and progress indicators
- Lay groundwork for AI-assisted Q&A and direct SCGas integration

## Quality Gates

These commands must pass for every user story:
- `pnpm typecheck` — Type checking
- `pnpm lint` — Linting (Ultracite/Biome)

## User Stories

### US-001: Fix disproportionate numbers in Scheduling Dashboard columns
As a gas operator, I want volume numbers in the scheduling table to display at a consistent, readable size so that I can quickly scan values without visual noise.

**Acceptance Criteria:**
- [ ] In `scheduling-dashboard-columns.tsx`, volume cells use a capped font size (e.g., `text-sm` or `text-base` instead of unconstrained sizing)
- [ ] Numbers with 6+ digits do not overflow their column containers
- [ ] `toLocaleString("pt-BR")` formatting is preserved
- [ ] Column minimum widths accommodate formatted PT-BR numbers (e.g., "54.000,0")

### US-002: Fix disproportionate numbers in Daily Entry Form
As a gas operator, I want QDS/QDP values in the daily entry form to scale appropriately so that large numbers don't break the layout.

**Acceptance Criteria:**
- [ ] In `daily-entry-form.tsx`, replace fixed `text-3xl font-bold` for QDS/QDP with responsive sizing (e.g., `text-xl` or dynamic class based on digit count)
- [ ] Numbers with 6+ digits remain fully visible without overflow
- [ ] Visual hierarchy is maintained (values are still prominent, just not oversized)

### US-003: Fix disproportionate numbers in Gas Dashboard summary cards
As a gas operator, I want summary card numbers in the gas dashboard to be readable regardless of value magnitude.

**Acceptance Criteria:**
- [ ] In `apps/web/src/features/gas/index.tsx`, summary cards use appropriate text sizing for large numbers
- [ ] Consider abbreviation for values above a threshold (e.g., "54 mil" or "54k") or use `text-lg` instead of `text-2xl` for large values
- [ ] Cards do not overflow or truncate unexpectedly
- [ ] Tooltip or hover shows the full precise value if abbreviation is used

### US-004: Block past dates in Scheduling Dashboard date picker
As a gas operator, I want the scheduling calendar to only allow selecting today or future dates so that I cannot accidentally create schedules for past dates.

**Acceptance Criteria:**
- [ ] In `scheduling-dashboard-date-picker.tsx`, the `<Calendar>` component receives `disabled={(date) => date < startOfToday()}` prop
- [ ] Navigation to past months is restricted via `fromDate={new Date()}`
- [ ] A validation message "Não é possível programar para datas passadas" is shown if a past date is somehow selected
- [ ] Admin users (based on user role/permissions) bypass the past-date restriction

### US-005: Fix generic DatePicker to not block future dates
As a developer, I want the generic `DatePicker` component to have configurable date restrictions so that each usage context can define its own rules.

**Acceptance Criteria:**
- [ ] In `apps/web/src/components/date-picker.tsx`, remove the hardcoded `disabled={(date) => date > new Date()}` or make it a configurable prop
- [ ] The DatePicker accepts an optional `disabled` prop for date filtering
- [ ] Existing usages of DatePicker are reviewed and updated to pass appropriate restrictions
- [ ] Default behavior (no prop) does not restrict any dates

### US-006: Add date validation to Daily Scheduling form
As a gas operator, I want the daily scheduling form date input to prevent selecting past dates so that invalid schedules cannot be submitted.

**Acceptance Criteria:**
- [ ] In `daily-scheduling-form.tsx`, the date `<Input>` has `min={format(new Date(), "yyyy-MM-dd")}` attribute
- [ ] Form validation rejects past dates with a clear error message
- [ ] Admin users bypass the restriction

### US-007: Unify navigation — remove Lançamento Diário
As a gas operator, I want a single clear entry point for daily data entry so that I'm not confused by overlapping screens.

**Acceptance Criteria:**
- [ ] Remove "Lançamento Diário" (`/gas/entry`) from the sidebar in `sidebar-data.ts`
- [ ] The route `/gas/entry` redirects to `/gas/scheduling-dashboard` (or is removed entirely)
- [ ] All daily data entry is consolidated in the Scheduling Dashboard
- [ ] "Programação Diária" (`/gas/scheduling`) remains as a read-only/history view
- [ ] No dead links or broken navigation references remain

### US-008: Investigate and fix Reports empty results
As a manager, I want the reports page to show data when relevant records exist so that I can make informed decisions.

**Acceptance Criteria:**
- [ ] Investigate `GET /gas/reports/dashboard` and `GET /gas/reports/petrobras` endpoints with valid test data
- [ ] Identify and fix filter defaults that cause empty results (e.g., default period should be last month with data, not future dates)
- [ ] Add smart default filters: auto-select the most recent period with available data
- [ ] Verify both Dashboard and Petrobras tabs return and render data correctly

### US-009: Improve Reports empty states
As a manager, I want clear guidance when reports have no data so that I know what to do next.

**Acceptance Criteria:**
- [ ] `EmptyChart` component shows an informative message: "Nenhum dado encontrado. Verifique se existem programações e consumos registrados para o período selecionado."
- [ ] Empty states suggest actionable next steps (e.g., "Altere os filtros ou registre programações para visualizar relatórios")
- [ ] Each report tab (Dashboard, Petrobras) has contextual empty state messaging

### US-010: Fix admin parameter icons — Edit button
As an admin user, I want intuitive icons on parameter editing buttons so that I can confidently perform actions without guessing.

**Acceptance Criteria:**
- [ ] In `alert-thresholds-tab.tsx`, `penalty-formulas-tab.tsx`, and `business-rules-tab.tsx`: replace `Save` (diskette) icon with `Pencil` or `PencilLine` for the edit button
- [ ] Replace `AlertTriangle` (cancel) icon with `X`
- [ ] Keep `Check` icon for the confirm/save action
- [ ] Add `<Tooltip>` (from `@acme/ui/tooltip`) to all action buttons with labels: "Editar", "Salvar", "Cancelar", "Restaurar padrão"

### US-011: Create Monthly Scheduling route and page shell
As a gas operator, I want a dedicated "Programação Mensal" page so that I can manage bulk monthly schedules.

**Acceptance Criteria:**
- [ ] New route at `/gas/monthly-scheduling` with authenticated layout
- [ ] Page component created at `apps/web/src/routes/_authenticated/gas/monthly-scheduling/index.tsx`
- [ ] Feature folder created at `apps/web/src/features/monthly-scheduling/`
- [ ] "Programação Mensal" added to sidebar in `sidebar-data.ts` under the Gas group
- [ ] Page renders with title and placeholder content

### US-012: Monthly Scheduling Excel upload with AI interpretation
As a gas operator, I want to upload an Excel spreadsheet so that the AI can interpret it and create monthly schedules automatically.

**Acceptance Criteria:**
- [ ] Drag-and-drop upload component (reuse pattern from `contract-upload-drawer.tsx`)
- [ ] Accepts `.xlsx` and `.xls` files
- [ ] Official template available for download with columns: Data, Unidade, Volume Programado (m³), Observações
- [ ] AI interprets the uploaded file (handles column name variations, date format variations, unit name matching)
- [ ] Server endpoint parses Excel using `exceljs`
- [ ] Validation errors are reported per row (invalid dates, unknown units, missing values)

### US-013: Monthly Scheduling preview and confirmation
As a gas operator, I want to preview imported data before confirming so that I can catch errors before they're saved.

**Acceptance Criteria:**
- [ ] Preview table shows all parsed rows with status (valid/error/warning)
- [ ] Error rows are highlighted with specific error messages
- [ ] User can exclude/edit individual rows before confirming
- [ ] Confirmation creates all valid `GasDailyPlan` records
- [ ] Import log is recorded (total rows, imported, errors, skipped)
- [ ] Success message shows summary of imported records

### US-014: Actual Consumption bulk import — upload drawer
As a gas operator, I want to import consumption records in bulk via Excel so that I can backfill data for periods of absence.

**Acceptance Criteria:**
- [ ] "Importar Consumos" button added next to "Registrar Consumo" in `actual-consumption-primary-buttons.tsx`
- [ ] Import drawer component created at `actual-consumption-import-drawer.tsx`
- [ ] Drag-and-drop upload accepting `.xlsx` and `.xls`
- [ ] Template with columns: Data, Hora, Unidade, Ponto de Medição, Consumo (m³), Fonte (medidor/manual/calculado)
- [ ] AI interprets the uploaded file (handles variations in column names, date/time formats)
- [ ] Server endpoint for Excel processing added to `gas.controller.ts`

### US-015: Actual Consumption bulk import — preview and validation
As a gas operator, I want to review and validate imported consumption data before saving so that I can ensure accuracy.

**Acceptance Criteria:**
- [ ] Preview table with row-level status (valid/error/warning)
- [ ] Validations: duplicate dates, gaps in data, values out of range (compared to contracted QDC)
- [ ] Warning for values significantly above/below expected range
- [ ] User can exclude or edit rows before confirming
- [ ] Import log with summary (imported, errors, skipped)
- [ ] Past dates are allowed for consumption imports (retroactive entry is valid)

### US-016: Create Penalties page shell and navigation
As a manager, I want a dedicated Penalties page so that I can monitor daily and monthly penalty calculations.

**Acceptance Criteria:**
- [ ] New route at `/gas/penalties` with authenticated layout
- [ ] Page component at `apps/web/src/routes/_authenticated/gas/penalties/index.tsx`
- [ ] Feature folder at `apps/web/src/features/penalties/`
- [ ] "Penalidades" added to sidebar in `sidebar-data.ts`
- [ ] Page renders with title, filter controls (period, contract, unit), and placeholder content

### US-017: Penalties daily and monthly views
As a manager, I want to see penalty breakdowns by type (PVEMA, PVEME, Sobredemanda) daily and monthly so that I can identify trends and take action.

**Acceptance Criteria:**
- [ ] Daily view: table with date, unit, penalty type, calculated value, formula applied
- [ ] Monthly view: aggregated totals per unit and penalty type
- [ ] Breakdown by type with clear labels (PVEMA, PVEME, Sobredemanda)
- [ ] Comparison with previous period (month-over-month)
- [ ] Data sourced from existing `GasCalculationService` methods
- [ ] Export to Excel for both views

### US-018: Create Tariff History model and CRUD
As an admin, I want to manage gas tariff history with validity periods so that penalty calculations use the correct tariff for each period.

**Acceptance Criteria:**
- [ ] New model `GasTariffHistory` in `schema.zmodel` with fields: id, contractId, tariffValue, validFrom, validTo, status (pending/approved/active/expired), createdBy, approvedBy, approvedAt
- [ ] CRUD endpoints for tariff management
- [ ] Tariff associated with contract
- [ ] Only one active tariff per contract at any given time
- [ ] `db:generate` and `db:push` run successfully

### US-019: Tariff management UI with approval workflow
As an admin, I want to create, approve, and track tariff changes so that tariff modifications are controlled and auditable.

**Acceptance Criteria:**
- [ ] Tariff management section within the Penalties page or as a sub-tab
- [ ] Form to create new tariff with: value, validity period, associated contract
- [ ] New tariffs start in "pending" status
- [ ] Approval action transitions tariff to "approved" → "active" when validity period starts
- [ ] History view showing all tariff changes with who created/approved and when
- [ ] Current active tariff is prominently displayed in the penalties dashboard

### US-020: Improve contract upload UX — progress indicator
As a user, I want to see clear progress during AI contract extraction so that I know the system is working and how long to wait.

**Acceptance Criteria:**
- [ ] In `contract-upload-drawer.tsx`, add a stepper or progress indicator during AI extraction
- [ ] Show stages: "Enviando arquivo" → "Analisando documento" → "Extraindo cláusulas" → "Concluído"
- [ ] Each stage has a visual indicator (spinner, checkmark on completion)
- [ ] If extraction fails, show clear error with retry option

### US-021: Contract versioning
As a user, I want to re-upload a contract and keep previous versions accessible so that I have a complete history of contract changes.

**Acceptance Criteria:**
- [ ] When uploading a contract for a unit/supplier that already has a contract, the system prompts: "Uma versão anterior existe. Deseja criar nova versão?"
- [ ] Previous versions remain accessible in a version history list
- [ ] Each version shows: upload date, extracted data summary, who uploaded
- [ ] Active version is clearly marked
- [ ] User can view and compare previous versions

### US-022: Improve contracts listing empty state
As a user, I want a helpful empty state on the contracts page so that I know how to get started.

**Acceptance Criteria:**
- [ ] In `apps/web/src/features/contracts/index.tsx`, improve the empty state with a clear CTA
- [ ] Empty state message: "Nenhum contrato cadastrado. Faça upload do seu primeiro contrato para começar."
- [ ] Prominent upload button in the empty state
- [ ] Brief explanation of the AI extraction capability

### US-023: Chatbot Q&A — contract and dashboard assistant
As a user, I want to ask natural language questions about my contracts and dashboard data so that I can get quick answers without navigating multiple screens.

**Acceptance Criteria:**
- [ ] Floating chat button (drawer/panel) accessible from gas pages
- [ ] Chat interface with message history within the session
- [ ] AI context includes: active contracts, recent scheduling data, consumption data, penalty calculations
- [ ] Can answer questions like: "Qual a penalidade acumulada este mês?", "Qual o QDC do contrato X?", "Compare consumo de janeiro vs fevereiro"
- [ ] Uses existing Claude integration from the project
- [ ] Responses include relevant data and can link to specific pages

### US-024: Direct SCGas scheduling integration — feasibility study
As a product owner, I want a documented feasibility analysis of direct SCGas scheduling integration so that we can plan the feature with technical and regulatory clarity.

**Acceptance Criteria:**
- [ ] Document created outlining: SCGas API availability, authentication requirements, data format requirements
- [ ] Regulatory considerations documented (authorization, data governance)
- [ ] Technical architecture proposal for integration (API gateway, retry logic, audit trail)
- [ ] Risk assessment with mitigation strategies
- [ ] Go/no-go recommendation with dependencies listed
- [ ] Document saved in project docs folder

## Functional Requirements
- FR-1: All numeric displays in gas-related pages must handle values up to 999.999.999 without layout overflow
- FR-2: The scheduling calendar must block past dates for non-admin users
- FR-3: Admin users must be able to bypass date restrictions via role-based permissions
- FR-4: Excel bulk imports must validate data before persisting and provide per-row error feedback
- FR-5: AI interpretation of Excel uploads must handle column name variations, date format variations, and fuzzy unit name matching
- FR-6: Penalty calculations must use the tariff active for the specific date period
- FR-7: Tariff changes require approval before becoming active
- FR-8: Only one tariff may be active per contract at any given time
- FR-9: Contract versioning must maintain referential integrity — existing records linked to old contract versions remain valid
- FR-10: The chatbot must only access data the authenticated user has permission to view
- FR-11: All bulk import operations must log: timestamp, user, file name, rows processed, rows imported, rows errored
- FR-12: Reports default filters must auto-select the most recent period with available data

## Non-Goals
- Custom color themes or whitelabeling
- Mobile-specific layouts for new features (existing responsive design is sufficient)
- Real-time WebSocket updates for penalty calculations
- Multi-language support (Portuguese only)
- Automated scheduling without user confirmation
- PDF export for reports (Excel only for MVP; PDF is a future enhancement)
- Per-component theme overrides for admin parameters
- Direct database access or raw SQL interfaces for end users

## Technical Considerations
- **Excel parsing:** Use `exceljs` (already in project dependencies) for all Excel import/export operations
- **AI interpretation:** Reuse existing Claude integration pattern from contract extraction for Excel interpretation
- **Penalties backend:** `GasCalculationService` already implements PVEMA, PVEME, and Sobredemanda calculations — UI needs to consume these
- **File upload:** Reuse `better-upload.ts` plugin infrastructure for all new upload features
- **Date handling:** Use `date-fns` (already in project) for all date operations — `startOfToday()`, `format()`, etc.
- **Schema changes:** `GasTariffHistory` model addition requires `db:generate` and `db:push`
- **Sidebar:** All new navigation items go into `sidebar-data.ts` — maintain existing grouping structure
- **Component library:** Use `@acme/ui` components (Tooltip, Dialog, Drawer, etc.) for consistency

## Success Metrics
- All numeric values display correctly at any magnitude without layout breakage
- Zero past-date scheduling submissions from non-admin users
- Bulk import success rate > 95% for well-formatted Excel files
- Penalties page shows calculated values matching backend service output
- Tariff approval workflow enforces separation of duties (creator ≠ approver)
- Reports page shows data on first load with smart default filters
- Admin users can identify button actions without trial-and-error

## Open Questions
- What is the maximum file size for Excel uploads? (Current upload limit in `better-upload.ts` may need adjustment)
- Should the chatbot have a token/message limit per session to control API costs?
- For tariff approval workflow: is a single approver sufficient, or is multi-level approval needed?
- Should penalty export include the tariff used for each calculation period?
- For contract versioning: should there be a limit on the number of versions retained?
- SCGas integration: who is the point of contact for API documentation and authorization?