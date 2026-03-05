# Feasibility Study: Direct SCGas Scheduling Integration

**Date:** 2026-03-05
**Author:** Technical Team
**Status:** Draft
**Version:** 1.0

---

## 1. Executive Summary

This document analyzes the feasibility of integrating Programagas.ai directly with SCGas (Sistema de Comercializacao de Gas) to allow gas scheduling submissions directly from our platform, eliminating the need for operators to manually input data into SCGas separately.

Currently, operators use Programagas.ai for planning and calculation, then manually transfer scheduling data to SCGas. Direct integration would streamline this workflow significantly.

---

## 2. SCGas API Availability & Authentication

### 2.1 Current State of SCGas API

SCGas is operated by gas distributors (e.g., SCGAS/Compass, Comgas, Bahiagas) and serves as the official system for gas commercialization and scheduling in Brazil. Key findings:

- **No public API documentation** is currently available from SCGas/distributors for third-party integration
- SCGas operates as a **closed portal** with web-based access for authorized companies
- Authentication uses **company-level credentials** (CNPJ-bound) issued by the distributor
- Some distributors may offer **EDI (Electronic Data Interchange)** channels for large consumers, but availability varies by region and distributor

### 2.2 Authentication Requirements (Estimated)

Based on similar energy sector integrations in Brazil:

- **Certificate-based authentication** (e-CNPJ / A1 digital certificate) is likely required
- **OAuth 2.0 or token-based** authentication if a REST API exists
- **IP whitelisting** may be required for automated access
- **Per-company authorization** - each client company would need to authorize our platform to act on their behalf

### 2.3 Data Format Requirements

Gas scheduling submissions to SCGas typically require:

| Field | Format | Description |
|-------|--------|-------------|
| CNPJ | String (14 digits) | Company identifier |
| Ponto de Entrega | Code | Delivery point identifier |
| Data Programacao | YYYY-MM-DD | Scheduling date |
| Volume Programado (m3/dia) | Decimal | Daily programmed volume |
| QDP (Quantidade Diaria Programada) | Decimal | Daily programmed quantity |
| Periodo | D+1, D+2, etc. | Scheduling horizon |
| Tipo | Intradiario/Diario/Mensal | Schedule type |

Our system already captures all these fields in the `GasDailyPlan` model and scheduling dashboard, making data mapping straightforward.

---

## 3. Regulatory Considerations

### 3.1 ANP Regulations

- **Resolucao ANP n. 52/2011** and subsequent updates govern gas commercialization and scheduling in Brazil
- Third-party systems submitting schedules on behalf of consumers must comply with **data integrity and audit trail** requirements
- All schedule modifications must be **timestamped and traceable** - our existing audit log system (US-related features) already supports this

### 3.2 Distributor-Specific Rules

- Each gas distributor (SCGAS, Comgas, etc.) may have **different scheduling windows** (e.g., D-1 by 14:00 for next-day scheduling)
- **Penalty calculations** (PVEMA, PVEME, Sobredemanda) are tied to the official schedule submitted to SCGas - our calculations must match exactly
- Re-scheduling rules (intraday modifications) vary by contract and distributor

### 3.3 Legal & Compliance

- **Power of Attorney (Procuracao)** - clients would likely need to grant formal authorization for Programagas.ai to submit schedules on their behalf
- **Data Protection (LGPD)** - handling of company credentials and scheduling data must comply with Brazilian data protection law
- **Liability** - clear terms of service needed for cases where automated submissions fail or contain errors
- **Non-repudiation** - digital signatures or equivalent proof that submissions were authorized by the client

---

## 4. Technical Architecture Proposal

### 4.1 Proposed Architecture

```
+------------------+     +-------------------+     +------------------+
|  Programagas.ai  |     |  Integration      |     |  SCGas           |
|  (Frontend)      |---->|  Service           |---->|  (Distributor)   |
|                  |     |                   |     |                  |
|  - Schedule UI   |     |  - Queue Manager  |     |  - API/Portal    |
|  - Review/Approve|     |  - Retry Logic    |     |  - Validation    |
|  - Status Track  |     |  - Credential Mgr |     |  - Confirmation  |
+------------------+     |  - Audit Logger   |     +------------------+
                         |  - Format Adapter |
                         +-------------------+
```

### 4.2 Key Components

1. **Submission Queue** - Async job queue (e.g., BullMQ) to handle submissions with retry logic, preventing data loss on failures
2. **Credential Vault** - Secure storage for client SCGas credentials (encrypted at rest, per-company isolation)
3. **Format Adapter** - Transforms our `GasDailyPlan` data into SCGas-required format (per-distributor adapters)
4. **Confirmation Tracker** - Polls/receives confirmation from SCGas and updates submission status in our system
5. **Approval Workflow** - Two-step process: operator reviews schedule in Programagas.ai, then explicitly approves submission to SCGas

### 4.3 Integration Approaches (by priority)

| Approach | Description | Complexity | Reliability |
|----------|-------------|-----------|-------------|
| **A. REST API** | Direct API calls if SCGas exposes one | Medium | High |
| **B. EDI/File Exchange** | Generate files in SCGas format, upload via SFTP | Medium | Medium |
| **C. RPA (Web Automation)** | Browser automation to fill SCGas web forms | High | Low |
| **D. Email-based** | Generate formatted emails that SCGas accepts | Low | Medium |

**Recommendation:** Pursue Approach A (REST API) first. If unavailable, Approach B (EDI/File Exchange) is the most reliable alternative. Approach C (RPA) should be a last resort due to fragility.

### 4.4 Database Changes

New models required in `packages/zen-v3/schema.zmodel`:

- `ScgasIntegration` - Per-company integration configuration (credentials, distributor, status)
- `ScgasSubmission` - Submission log (schedule reference, status, response, timestamps)
- `ScgasCredential` - Encrypted credential storage (separate from main auth)

### 4.5 Existing Infrastructure Leverage

Our current codebase provides solid foundations:

- **GasDailyPlan model** - Already captures all scheduling data needed for submission
- **Audit log system** - Can be extended to track SCGas submission events
- **Contract extraction** - Contract parameters (scheduling windows, penalties) already extracted by AI
- **Penalty calculation service** (`GasCalculationService`) - Already implements PVEMA, PVEME, Sobredemanda calculations
- **Queue infrastructure** - Elysia server can be extended with job queue support

---

## 5. Risk Assessment & Mitigation

### 5.1 High Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SCGas has no API / refuses integration | Blocks feature entirely | High | Contact distributors early; prepare RPA fallback |
| Incorrect schedule submission | Financial penalties for client | Medium | Mandatory review step; dry-run mode; submission preview |
| Credential security breach | Legal liability, client trust loss | Low | HSM/vault storage; encryption at rest; access audit trail |
| SCGas API changes without notice | Integration breaks | Medium | Health monitoring; automated alerts; graceful degradation |

### 5.2 Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Different formats per distributor | Multiplied development effort | High | Adapter pattern; start with one distributor (SCGAS/Compass) |
| Scheduling window missed | Client penalty | Medium | Automated scheduling with buffer time; deadline alerts |
| Network/availability issues | Failed submissions | Medium | Retry queue with exponential backoff; manual fallback |
| Regulatory changes | Feature redesign | Low | Monitor ANP publications; modular architecture |

### 5.3 Low Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance under load | Slow submissions | Low | Queue-based async processing |
| Client adoption resistance | Low feature usage | Medium | Gradual rollout; keep manual workflow available |

---

## 6. Go/No-Go Recommendation

### Recommendation: CONDITIONAL GO

The integration is technically feasible and would provide significant value to operators by eliminating manual data transfer. However, it is **blocked by an external dependency** - SCGas API availability.

### Prerequisites (Must be resolved before development)

1. **Contact SCGas/distributor** (SCGAS/Compass as primary target) to determine:
   - Is there an API or EDI channel available for third-party scheduling?
   - What are the authentication and authorization requirements?
   - What is the certification/approval process for third-party integrations?
   - What are the data format specifications?

2. **Legal review** of liability framework for automated submissions

3. **Client validation** - confirm at least 2-3 clients are willing to authorize automated submission

### Dependencies

| Dependency | Owner | Status | Blocking |
|------------|-------|--------|----------|
| SCGas API access / documentation | SCGas/Distributor | Not started | Yes |
| Legal framework for automated submissions | Legal team | Not started | Yes |
| Client authorization agreements | Business team | Not started | Yes |
| e-CNPJ certificate handling capability | Engineering | Not started | No |
| Job queue infrastructure (BullMQ or similar) | Engineering | Not started | No |

### Suggested Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| **Phase 0: Discovery** | 2-4 weeks | Contact distributors, legal review, client validation |
| **Phase 1: Pilot** | 4-6 weeks | Single-distributor integration with one pilot client |
| **Phase 2: Hardening** | 2-3 weeks | Error handling, monitoring, security audit |
| **Phase 3: Rollout** | 2-4 weeks | Multi-distributor support, general availability |

### Next Steps

1. Schedule meeting with SCGAS/Compass technical team to discuss API availability
2. Prepare NDA and partnership proposal for data integration
3. Begin legal review of automated submission liability framework
4. If API confirmed available: proceed to Phase 1 development
5. If no API available: evaluate RPA approach feasibility with a focused spike

---

## Appendix A: Current System Data Flow

```
Current Flow (Manual):
Operator -> Programagas.ai (plan schedule) -> Export/Copy -> SCGas Portal (manual entry)

Proposed Flow (Integrated):
Operator -> Programagas.ai (plan schedule) -> Review & Approve -> Auto-submit to SCGas -> Confirmation
```

## Appendix B: Relevant Codebase References

- **Scheduling data model:** `packages/zen-v3/schema.zmodel` (GasDailyPlan, GasContract)
- **Penalty calculations:** `apps/server/src/modules/gas/gas.service.ts` (GasCalculationService)
- **Contract extraction:** `apps/server/src/modules/contract-extraction/contract-extraction.controller.ts`
- **Audit log system:** `apps/web/src/features/audit-log/`
- **Gas dashboard:** `apps/web/src/features/gas/index.tsx`
- **Daily scheduling:** `apps/web/src/features/scheduling-dashboard/`
