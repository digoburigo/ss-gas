# PRD: MVP programa.ai — Ajustes e Melhorias

## Overview
Conjunto de ajustes, correções e melhorias para o sistema de gestão de gás (programa.ai), cobrindo: derivação automática da programação diária a partir dos equipamentos, consolidação do painel de programação, correção do salvamento do lançamento diário, placar mensal de consumo real com gráficos comparativos, reforço de alertas, dashboard global de relatórios, gestão administrativa de equipamentos, extração automática de fórmulas de penalidade de contratos PDF, e histórico de auditoria completo.

## Goals
- Eliminar entrada manual da programação diária, derivando QDP automaticamente do status ON/OFF dos equipamentos
- Consolidar a experiência de programação com a aba "Programação Diária" como resumo read-only e o Painel como ponto de entrada
- Corrigir bug de persistência no lançamento diário
- Entregar placar mensal de consumo real com taxa de assertividade, penalidade acumulada e acurácia média
- Gráfico Planejado x Realizado funcional e validado
- Dashboard global de relatórios com gráficos consolidados
- CRUD completo de equipamentos com vínculo a unidades e contratos via painel admin
- Extração automática de fórmulas de penalidade de contratos PDF via IA
- Suporte a múltiplos contratos por cliente (Cliente → Unidade → Contrato)
- Histórico de auditoria abrangente (login/logout + todas alterações de dados)
- Simular auditoria com dados fictícios para validação

## Quality Gates

These commands must pass for every user story:
- `pnpm typecheck` — Type checking
- `pnpm lint` — Linting (Ultracite/Biome)

For UI stories, also include:
- Verify in browser using dev-browser skill

## User Stories

### US-001: Derivação automática da programação diária a partir dos equipamentos
As a operador, I want the daily schedule (QDP) to be automatically calculated from equipment ON/OFF status and consumption constants so that I don't need to enter values manually.

**Acceptance Criteria:**
- [ ] When equipment status changes (ON/OFF) in the equipment screen, QDP is recalculated automatically
- [ ] Calculation uses formula: sum of (m³/h × horas previstas) for each ON equipment from `GasEquipmentConstant`
- [ ] QDP value is persisted in `GasDailyPlan` without manual input
- [ ] Equipment status toggle triggers real-time QDP recalculation on the frontend
- [ ] Existing endpoint `POST /gas/units/:unitId/entries` updated to accept equipment status array and auto-calculate QDP
- [ ] Unit tests validate calculation logic in `gas.service.ts`

### US-002: Aba Programação Diária como resumo read-only
As a gestor, I want the "Programação Diária" tab to show a read-only summary of schedules so that I have a quick overview without editing capabilities.

**Acceptance Criteria:**
- [ ] Route `/gas/scheduling` displays a summary table (date, unit, QDP value, status) — no edit controls
- [ ] All data entry and editing is only possible via the Painel de Programação (`/gas/scheduling-dashboard`)
- [ ] Summary table shows submitted/approved/pending status per day per unit
- [ ] Clicking a row navigates to the Painel de Programação filtered to that date/unit
- [ ] Components in `apps/web/src/features/daily-scheduling/` updated to remove edit forms
- [ ] Clear visual indication that the view is read-only

### US-003: Painel de Programação como ponto único de entrada
As a operador, I want the Scheduling Dashboard to be the single place where I create and manage daily schedules so that the workflow is centralized.

**Acceptance Criteria:**
- [ ] `/gas/scheduling-dashboard` supports creating new daily plans directly
- [ ] Equipment ON/OFF toggle integrated into the dashboard with auto QDP calculation (from US-001)
- [ ] Submit/approve workflow works from within the dashboard
- [ ] Date picker allows navigating to any day
- [ ] Shows all units with their QDP values for the selected date
- [ ] Components in `apps/web/src/features/scheduling-dashboard/` updated with entry capabilities

### US-004: Investigar e corrigir bug de salvamento do lançamento diário
As a developer, I want to investigate and fix the daily entry persistence bug so that programações are saved correctly.

**Acceptance Criteria:**
- [ ] Investigate the save flow in `POST /gas/units/:unitId/entries` endpoint (`gas.controller.ts`)
- [ ] Identify root cause of data not persisting (check `GasDailyEntry`, `GasDailyPlan`, `GasLineStatus` writes)
- [ ] Fix the persistence issue
- [ ] Verify data survives page reload after save
- [ ] Verify editing an existing entry updates correctly (no duplicate records)
- [ ] Test with multiple units and dates
- [ ] Add error handling with user-visible feedback on save failure

### US-005: Gráfico comparativo Planejado x Realizado
As a gestor, I want a chart comparing planned (QDP) vs actual (QDR) consumption so that I can visualize deviations at a glance.

**Acceptance Criteria:**
- [ ] Bar or line chart on `/gas/actual-consumption` or `/gas/reports` showing QDP vs QDR per day
- [ ] Date range selector (default: current month)
- [ ] Unit filter (select one or all units)
- [ ] Visual highlight when QDR exceeds tolerance bands (±10% / −20% per CUSD contract)
- [ ] Tooltip shows exact values on hover
- [ ] Chart is responsive and works on mobile
- [ ] Data fetched from existing `GasDailyPlan` (QDP) and `GasRealConsumption` (QDR) models

### US-006: Placar mensal de consumo real
As a gestor, I want a monthly scorecard showing assertiveness rate, accumulated penalties, and average accuracy so that I can track performance at a glance.

**Acceptance Criteria:**
- [ ] Scorecard component displayed on `/gas/actual-consumption` or `/gas/scheduling-accuracy`
- [ ] **Taxa de assertividade (%)**: percentage of days in the month where QDR is within tolerance of QDP (±10% upper / −20% lower per CUSD)
- [ ] **Penalidade acumulada (R$)**: sum of PVEMA + PVEME + Sobredemanda for the month, calculated using contract formulas
- [ ] **Taxa de acurácia média (%)**: mean of (QDR/QDP × 100) across all days in the month
- [ ] Month/year selector
- [ ] Unit and contract filter
- [ ] Values validated against manual Excel calculations
- [ ] Card-style layout with color coding (green/yellow/red thresholds)

### US-007: Validar cálculos de penalidade e assertividade
As a gestor, I want penalty and accuracy calculations to be verified so that I can trust the system's numbers.

**Acceptance Criteria:**
- [ ] PVEMA calculation follows CUSD formula: penalty for exceeding upper transport tolerance
- [ ] PVEME calculation follows CUSD formula: penalty for falling below lower transport tolerance
- [ ] Sobredemanda calculation follows CUSD tiered formula (0-10%, 10-20%, >20% over QDC)
- [ ] Calculation logic in `gas.service.ts` has unit tests with known input/output pairs
- [ ] Results match manual Excel calculations for at least 3 test scenarios
- [ ] Edge cases tested: zero consumption days, missing QDP, partial month data

### US-008: Reforçar funcionalidade de alertas
As a gestor, I want the alerts system to be robust and reliable so that I never miss critical contract deadlines or deviations.

**Acceptance Criteria:**
- [ ] Review and fix contract alert delivery (`contract-alert.service.ts`, `notification.service.ts`)
- [ ] Verify scheduled jobs in `scheduled-jobs.service.ts` are running correctly (cron timing)
- [ ] Deviation alerts trigger when QDR exceeds tolerance bands
- [ ] Contract expiration alerts fire at configured advance notice days (e.g., 30, 15, 7, 1 days)
- [ ] Alert history (`GasAlertSentLog`) records all sent notifications
- [ ] Failed alert deliveries are retried and logged
- [ ] UI at `/gas/contract-alerts` shows alert status (sent/pending/failed)
- [ ] UI at `/gas/deviation-alerts` shows real-time deviation status

### US-009: Dashboard global de relatórios
As a gestor, I want a consolidated reports dashboard with charts so that I have a single view of all key metrics.

**Acceptance Criteria:**
- [ ] New dashboard section on `/gas/reports` with consolidated charts
- [ ] Chart: Consumo mensal Planejado vs Realizado por unidade (bar chart grouped by unit)
- [ ] Chart: Penalidades acumuladas por contrato ao longo dos meses (line chart, month over month)
- [ ] Chart: Taxa de assertividade histórica (line chart, trend over months)
- [ ] Chart: Comparativo entre unidades (horizontal bar chart ranking units by accuracy)
- [ ] Chart: Distribuição de consumo por tipo de equipamento (pie/donut chart)
- [ ] Date range filter (monthly, quarterly, yearly)
- [ ] Unit/contract filters
- [ ] Export dashboard to PDF or Excel
- [ ] Layout inspired by existing Excel reference model provided by user

### US-010: CRUD completo de equipamentos via admin
As a admin, I want to manage equipment through the admin panel so that I can add, edit, deactivate, and link equipment to units and contracts.

**Acceptance Criteria:**
- [ ] Admin page at `/gas/admin` or new section in `/gas/consumer-units` with equipment management
- [ ] Create equipment: name, type (atomizer/line/dryer/other), order index
- [ ] Edit equipment properties
- [ ] Deactivate/reactivate equipment (soft delete)
- [ ] Delete equipment (with validation — cannot delete if has associated daily entries)
- [ ] Link/unlink equipment to consumer units (`GasUnit`)
- [ ] Link/unlink equipment to contracts (`GasContract`)
- [ ] Manage consumption constants (`GasEquipmentConstant`) with effective date ranges
- [ ] Table view with filters by type, unit, status
- [ ] Only users with `admin` profile can access

### US-011: Extração automática de fórmulas de penalidade de contratos PDF
As a admin, I want the system to automatically extract penalty formulas from uploaded contract PDFs so that I don't need to manually enter complex parameters.

**Acceptance Criteria:**
- [ ] Extend existing `/contract-extraction/extract` endpoint to specifically extract penalty parameters
- [ ] Extract CUSD penalty fields: CMC rates, PVEMA formula/thresholds, PVEME formula/thresholds, Sobredemanda tiers, TUSD tariffs
- [ ] Extracted values populate the contract form fields with confidence scores
- [ ] Admin can review and confirm/edit extracted values before saving
- [ ] Handle multiple contract formats (not just CUSD template)
- [ ] Extraction works for the provided generic CUSD contract PDF
- [ ] Confidence score displayed per field (high/medium/low)
- [ ] UI shows side-by-side: PDF preview + extracted fields

### US-012: Suporte a múltiplos contratos por cliente (hierarquia Cliente → Unidade → Contrato)
As a admin, I want to manage multiple active contracts per client/unit so that complex setups like Dexco (3 contracts in Revestimentos Cerâmicos) are supported.

**Acceptance Criteria:**
- [ ] `GasContract` already has `unitId` — verify a single `GasUnit` can have multiple active contracts
- [ ] UI at `/gas/contracts` shows all contracts grouped by unit
- [ ] Contract selector available in scheduling, consumption, and reports pages when unit has multiple contracts
- [ ] Penalty calculations use the correct contract for each unit/period
- [ ] Dashboard and reports aggregate or filter by contract
- [ ] No regression — units with single contracts continue to work seamlessly

### US-013: Histórico de auditoria abrangente
As a admin, I want comprehensive audit logging including login/logout and all data changes so that every system action is traceable.

**Acceptance Criteria:**
- [ ] Login events recorded in `GasAuditLog` (user, timestamp, IP if available)
- [ ] Logout events recorded
- [ ] All CRUD operations on all Gas models logged (create, update, delete)
- [ ] Field-level change tracking (old value → new value) for updates
- [ ] Audit log records: who, what, when, which record, what changed
- [ ] UI at `/gas/audit-log` displays all events with filters (date range, user, action type, entity type)
- [ ] Export audit log to Excel
- [ ] Existing `GasAuditLog` and `GasContractAuditLog` models consolidated or both utilized

### US-014: Simular auditoria com dados fictícios
As a admin, I want to test the audit system with simulated data so that I can validate it works correctly before production use.

**Acceptance Criteria:**
- [ ] Seed script generates realistic fake audit data (50+ entries across different entities and action types)
- [ ] Seed data covers: login/logout, contract changes, equipment changes, scheduling changes, consumption entries
- [ ] Audit log UI correctly displays and filters all seeded data
- [ ] Details dialog shows full change history for each entry
- [ ] Export to Excel includes all seeded data correctly
- [ ] Seed script is idempotent (can run multiple times without duplicating data)
- [ ] Script located at `apps/server/src/seed/` or similar

## Functional Requirements
- FR-1: QDP must be automatically derived from equipment ON/OFF status using consumption constants (m³/h × hours)
- FR-2: The "Programação Diária" tab must be read-only; all edits happen in the Painel de Programação
- FR-3: Daily entries must persist correctly in the database after save
- FR-4: The Planejado x Realizado chart must display QDP vs QDR with tolerance bands
- FR-5: Monthly scorecard must calculate assertiveness, accumulated penalty, and average accuracy
- FR-6: Penalty calculations (PVEMA, PVEME, Sobredemanda) must follow CUSD formulas exactly
- FR-7: All contract alerts must fire at configured advance notice days and be logged
- FR-8: Deviation alerts must trigger when QDR exceeds configured tolerance bands
- FR-9: Reports dashboard must show consolidated charts with date range and unit/contract filters
- FR-10: Equipment CRUD must support linking/unlinking to units and contracts
- FR-11: PDF contract extraction must identify and extract penalty formula parameters via AI
- FR-12: A single unit must support multiple active contracts simultaneously
- FR-13: All write operations must be logged in the audit trail with field-level detail
- FR-14: Login and logout events must be recorded in the audit log

## Non-Goals (Out of Scope)
- **Regras de negócio** — Não implementar neste momento
- **Templates de contrato** — Não implementar neste momento
- Custom color themes or branding per client
- Mobile native app changes (Expo) — focus is web only
- Multi-language support
- Real-time WebSocket updates (polling is acceptable)
- Automated PDF extraction without admin review/confirmation

## Technical Considerations
- **Database schema**: Models already exist in `packages/zen-v3/schema.zmodel` — some may need new fields or relations
- **Calculation service**: `apps/server/src/modules/gas/gas.service.ts` contains core logic — extend for penalties
- **Contract extraction**: `apps/server/src/modules/contract-extraction/contract-extraction.controller.ts` already uses Claude Sonnet 4 for PDF extraction — extend prompt for penalty formulas
- **Charts**: Use existing chart component patterns from `apps/web/src/components/dash/`
- **Audit**: `GasAuditLog` model exists — may need extension for login/logout events
- **Multiple contracts**: `GasContract.unitId` exists — verify no unique constraint blocking multiple contracts per unit
- **Frontend state**: Feature components use provider pattern (`*-provider.tsx`) — follow this pattern for new features
- **API client**: Uses Elysia Treaty (`apps/web/src/clients/api-client.ts`) — extend for new endpoints
- **ZenStack queries**: Use `@zenstackhq/tanstack-query/react` for client-side data fetching following existing patterns

## Success Metrics
- Programação diária is 100% derived from equipment status (zero manual entry)
- Daily entry save bug resolved — 100% persistence rate
- Penalty calculations match manual Excel within ±0.01%
- All alerts fire on time with zero missed deadlines in testing
- Audit log captures 100% of write operations and auth events
- Dashboard loads within 3 seconds with 12 months of data
- Admin can manage equipment end-to-end without developer intervention
- PDF extraction correctly identifies penalty parameters in >90% of standard CUSD contracts

## Open Questions
- Should the Planejado x Realizado chart also be available per-equipment (not just per-unit)?
- What exact Excel reference model should the reports dashboard replicate? (Need file from user)
- Should audit log retention have a time limit (e.g., 2 years) or be kept indefinitely?
- For multiple contracts per unit, how should the system determine which contract applies when date ranges overlap?
- Should equipment deactivation cascade to future scheduling (auto-remove from QDP)?