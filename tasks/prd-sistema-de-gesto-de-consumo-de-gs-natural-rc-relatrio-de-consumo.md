# Sistema de Gestão de Consumo de Gás Natural - RC (Relatório de Consumo)

**Version:** 1.0  
**Date:** January 2026  
**Author:** Rodrigo Burigo / Product Team  

---

## Tech Stack Mapping

| Layer | Technology |
|-------|------------|
| Frontend | TanStack Router (apps/web) |
| Backend | ElysiaJS on Node.js (apps/server) |
| Database/ORM | ZenStack v3 (packages/zen-v3) |
| Authentication | better-auth with organization + admin plugins (packages/auth) |
| UI Components | Base UI (packages/ui/base-ui) |
| Email Templating | react-email |
| Email Sending | Resend |
| API Client | ZenStack TanStack Query integration |

---

## 1. Executive Summary

This document defines the requirements for automating the gas consumption management workflow currently handled through Excel spreadsheets (RC - Relatório de Consumo). The system manages daily gas consumption planning and tracking across three industrial units (Criciúma, Urussanga, and Botucatu) that supply natural gas data to Petrobras under contractual obligations.

The primary goal is to eliminate manual spreadsheet operations, automate calculations, enable real-time monitoring, and provide proactive alerting for compliance and operational efficiency.

---

## 2. Business Context

### 2.1 Current State
- **Manual Process:** Daily data entry in Excel spreadsheets by unit operators
- **Multiple Units:** 3 production facilities with different equipment configurations
- **Contractual Compliance:** Strict gas consumption limits defined by Petrobras contract (134,800 m³/day with ±20%/±30% tolerance bands)
- **Monthly Reporting:** Data consolidated monthly for Petrobras submission
- **Pain Points:**
  - Manual formula errors
  - Delayed data entry
  - Lack of real-time visibility
  - No automated alerts for contract violations
  - Version control issues with Excel files

### 2.2 Target Users

| User Role | Description | Primary Actions |
|-----------|-------------|-----------------|
| Unit Operator | Factory floor personnel at each unit | Daily data entry (operating hours, equipment status) |
| Engineering Manager | Oversees all units | Reviews consolidated data, approves adjustments |
| Planning Coordinator | Plans monthly gas allocation | Sets QDP (Programmed Daily Quantity) targets |
| Petrobras Liaison | External reporting | Exports monthly reports |
| System Administrator | IT/Platform admin | Manages users, units, equipment configuration |

---

## 3. Data Model (ZenStack v3 ZModel)

### 3.1 Core Entities

```zmodel
// packages/zen-v3/schema.zmodel

enum EquipmentType {
  ATOMIZER
  PRODUCTION_LINE
  DRYER
}

enum ConsumptionUnit {
  HOURLY
  DAILY
}

enum LineStatusValue {
  ON
  OFF
}

enum ConsumptionSource {
  MANUAL
  API
  IMPORT
}

model Unit {
  id             String         @id @default(cuid())
  name           String         // "Criciúma", "Urussanga", "Botucatu"
  code           String         @unique // "CRI", "URU", "BOT"
  organizationId String
  organization   Organization   @relation(fields: [organizationId], references: [id])
  isActive       Boolean        @default(true)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  equipment      Equipment[]
  entries        DailyEntry[]
  plans          DailyPlan[]
  consumption    RealConsumption[]

  @@allow('read', auth() != null && organization.members?[user == auth()])
  @@allow('create,update,delete', auth() != null && organization.members?[user == auth() && role == 'ADMIN'])
}

model Equipment {
  id              String              @id @default(cuid())
  unitId          String
  unit            Unit                @relation(fields: [unitId], references: [id])
  name            String              // "Atomizador 180", "Linha 0", "Secador 2"
  type            EquipmentType
  consumptionRate Float               // m³/hour or m³/day depending on type
  consumptionUnit ConsumptionUnit
  isActive        Boolean             @default(true)
  displayOrder    Int

  constants       EquipmentConstant[]
  lineStatuses    LineStatus[]

  @@allow('read', auth() != null && unit.organization.members?[user == auth()])
  @@allow('create,update,delete', auth() != null && unit.organization.members?[user == auth() && role == 'ADMIN'])
}

model EquipmentConstant {
  id              String     @id @default(cuid())
  equipmentId     String
  equipment       Equipment  @relation(fields: [equipmentId], references: [id])
  consumptionValue Float     // The rate value
  unit            String     // "m³/h" or "m³/d"
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  createdById     String
  createdBy       User       @relation(fields: [createdById], references: [id])
  notes           String?
  createdAt       DateTime   @default(now())

  @@allow('read', auth() != null && equipment.unit.organization.members?[user == auth()])
  @@allow('create,update,delete', auth() != null && equipment.unit.organization.members?[user == auth() && role == 'ADMIN'])
}

model DailyEntry {
  id                   String       @id @default(cuid())
  unitId               String
  unit                 Unit         @relation(fields: [unitId], references: [id])
  date                 DateTime     @db.Date
  
  // Atomizer data
  atomizerScheduled    Boolean
  atomizerHours        Float        // 0-24 hours
  
  // For Botucatu (has 2 atomizers)
  atomizerSecScheduled Boolean?
  atomizerSecHours     Float?
  
  // Calculated fields (auto-computed on backend)
  qdcAtomizer          Float
  qdcLines             Float
  qdsCalculated        Float
  qdsManual            Float?       // Override if manually adjusted
  
  // Metadata
  observations         String?
  isManuallyAdjusted   Boolean      @default(false)
  createdById          String
  createdBy            User         @relation("EntryCreatedBy", fields: [createdById], references: [id])
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt
  updatedById          String
  updatedBy            User         @relation("EntryUpdatedBy", fields: [updatedById], references: [id])

  lineStatuses         LineStatus[]

  @@unique([unitId, date])
  
  @@allow('read', auth() != null && unit.organization.members?[user == auth()])
  @@allow('create', auth() != null && unit.organization.members?[user == auth()])
  @@allow('update', auth() != null && unit.organization.members?[user == auth()])
  @@allow('delete', auth() != null && unit.organization.members?[user == auth() && role == 'ADMIN'])
}

model LineStatus {
  id           String          @id @default(cuid())
  entryId      String
  entry        DailyEntry      @relation(fields: [entryId], references: [id], onDelete: Cascade)
  equipmentId  String
  equipment    Equipment       @relation(fields: [equipmentId], references: [id])
  status       LineStatusValue

  @@unique([entryId, equipmentId])
  
  @@allow('all', auth() != null && entry.unit.organization.members?[user == auth()])
}

model DailyPlan {
  id          String    @id @default(cuid())
  unitId      String
  unit        Unit      @relation(fields: [unitId], references: [id])
  date        DateTime  @db.Date
  qdpValue    Float     // QDP - Programmed Daily Quantity
  createdById String
  createdBy   User      @relation("PlanCreatedBy", fields: [createdById], references: [id])
  createdAt   DateTime  @default(now())
  approvedById String?
  approvedBy  User?     @relation("PlanApprovedBy", fields: [approvedById], references: [id])
  approvedAt  DateTime?

  @@unique([unitId, date])
  
  @@allow('read', auth() != null && unit.organization.members?[user == auth()])
  @@allow('create,update', auth() != null && unit.organization.members?[user == auth()])
  @@allow('delete', auth() != null && unit.organization.members?[user == auth() && role == 'ADMIN'])
}

model RealConsumption {
  id        String            @id @default(cuid())
  unitId    String
  unit      Unit              @relation(fields: [unitId], references: [id])
  date      DateTime          @db.Date
  qdrValue  Float             // QDR - Real consumption from meter
  source    ConsumptionSource
  createdAt DateTime          @default(now())

  @@unique([unitId, date])
  
  @@allow('read', auth() != null && unit.organization.members?[user == auth()])
  @@allow('create,update', auth() != null && unit.organization.members?[user == auth()])
  @@allow('delete', auth() != null && unit.organization.members?[user == auth() && role == 'ADMIN'])
}

model Contract {
  id                    String       @id @default(cuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])
  qdcLimit              Float        // 134800 m³/day
  transportToleranceMin Float        // 0.8 (-20%)
  transportToleranceMax Float        // 1.1 (+10%)
  moleculeToleranceMin  Float        // 0.95 (-5%)
  moleculeToleranceMax  Float        // 1.05 (+5%)
  incentiveBonus        Float        // 1.2 (+20% bonus threshold)
  incentivePenalty      Float        // 0.7 (-30% penalty threshold)
  effectiveFrom         DateTime
  effectiveTo           DateTime?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@allow('read', auth() != null && organization.members?[user == auth()])
  @@allow('create,update,delete', auth() != null && organization.members?[user == auth() && role == 'ADMIN'])
}
```

---

## 4. Core Features

### 4.1 Daily Data Entry Module

#### 4.1.1 Unit-Specific Entry Forms
Each unit has a dedicated data entry form matching its equipment configuration.

**Criciúma Form Fields:**
- Date (auto-populated, editable for past dates with permission)
- Day of week (auto-calculated)
- Atomizer Scheduled: Yes/No toggle
- Atomizer Operating Hours: 0-24 numeric input
- Production Lines L0-L7: ON/OFF toggle for each
- Observations: Free text field
- Submit button with validation

**Urussanga Form Fields:**
- Same as Criciúma but with only L1, L2 production lines

**Botucatu Form Fields:**
- ATM 250 Scheduled: Yes/No
- ATM 250 Hours: 0-24
- ATM 052 Scheduled: Yes/No
- ATM 052 Hours: 0-24
- Secador 2: ON/OFF
- Production Lines L1, L2: ON/OFF toggles

#### 4.1.2 Auto-Calculation Engine

```typescript
// apps/server/src/services/gas-calculation.service.ts

export class GasCalculationService {
  calculateQdcAtomizer(equipment: Equipment[], hours: number, secondaryHours?: number): number {
    const primary = equipment.find(e => e.type === 'ATOMIZER' && e.displayOrder === 0);
    const secondary = equipment.find(e => e.type === 'ATOMIZER' && e.displayOrder === 1);
    
    let total = 0;
    if (primary) total += hours * primary.consumptionRate;
    if (secondary && secondaryHours) total += secondaryHours * secondary.consumptionRate;
    
    return total;
  }

  calculateQdcLines(equipment: Equipment[], lineStatuses: LineStatus[]): number {
    return lineStatuses
      .filter(ls => ls.status === 'ON')
      .reduce((sum, ls) => {
        const equip = equipment.find(e => e.id === ls.equipmentId);
        return sum + (equip?.consumptionRate ?? 0);
      }, 0);
  }

  calculateQds(qdcAtomizer: number, qdcLines: number): number {
    return qdcAtomizer + qdcLines;
  }

  calculateDeviations(qdp: number, qdr: number, contract: Contract) {
    const transportMin = qdp * contract.transportToleranceMin;
    const transportMax = qdp * contract.transportToleranceMax;
    const moleculeMin = qdp * contract.moleculeToleranceMin;
    const moleculeMax = qdp * contract.moleculeToleranceMax;

    const deltaTransport = 
      (qdr < transportMin ? Math.abs(qdr - transportMin) : 0) +
      (qdr > transportMax ? Math.abs(qdr - transportMax) : 0);

    const deltaMolecule =
      (qdr < moleculeMin ? Math.abs(qdr - moleculeMin) : 0) +
      (qdr > moleculeMax ? Math.abs(qdr - moleculeMax) : 0);

    return {
      transportMin,
      transportMax,
      moleculeMin,
      moleculeMax,
      deltaTransport,
      deltaMolecule,
      percentTransport: qdp > 0 ? deltaTransport / qdp : 0,
      percentMolecule: qdp > 0 ? deltaMolecule / qdp : 0,
      isWithinTransport: qdr >= transportMin && qdr <= transportMax,
      isWithinMolecule: qdr >= moleculeMin && qdr <= moleculeMax,
    };
  }
}
```

### 4.2 Consolidated Dashboard

#### 4.2.1 Daily Summary View
Displays aggregated data across all units:

| Field | Description | Calculation |
|-------|-------------|-------------|
| QDC | Contracted Daily Quantity | Fixed: 134,800 m³/d |
| QDS | Forecasted Daily Consumption | Sum of all units' QDS |
| QDP | Programmed Daily Quantity | Sum of all units' QDP |
| QDR | Real Daily Consumption | Sum of real meter readings |
| Status | OK/NOK flag | QDP === QDS ? "OK" : "NOK" |

#### 4.2.2 Tolerance Band Indicators
- Visual indicator: Green (within), Yellow (near limit), Red (exceeded)

### 4.3 Notification & Alert System

Using react-email + resend infrastructure.

#### 4.3.1 Email Templates (react-email)

```typescript
// packages/email/templates/missing-daily-entry.tsx
import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';

interface MissingDailyEntryProps {
  userName: string;
  unitName: string;
  date: string;
  systemUrl: string;
}

export function MissingDailyEntryEmail({ userName, unitName, date, systemUrl }: MissingDailyEntryProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Olá {userName},</Text>
          <Text>
            A entrada diária de consumo de gás para a unidade {unitName}
            ainda não foi registrada para o dia {date}.
          </Text>
          <Button href={systemUrl}>Acessar Sistema</Button>
          <Text>Dados necessários:</Text>
          <Text>• Status do atomizador</Text>
          <Text>• Horas de funcionamento</Text>
          <Text>• Status das linhas de produção</Text>
          <Hr />
          <Text>Sistema RC - Gestão de Consumo de Gás</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

#### 4.3.2 Notification Service

```typescript
// apps/server/src/services/notification.service.ts
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { MissingDailyEntryEmail } from '@acme/email/templates/missing-daily-entry';

export class NotificationService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendMissingEntryAlert(user: User, unit: Unit, date: Date) {
    const html = await render(MissingDailyEntryEmail({
      userName: user.name,
      unitName: unit.name,
      date: date.toLocaleDateString('pt-BR'),
      systemUrl: `${process.env.APP_URL}/units/${unit.id}/entries`,
    }));

    await this.resend.emails.send({
      from: 'RC System <rc@company.com>',
      to: user.email,
      subject: `⚠️ [RC System] Entrada diária pendente - ${unit.name} - ${date.toLocaleDateString('pt-BR')}`,
      html,
    });
  }
}
```

---

## 5. API Structure (ElysiaJS)

```typescript
// apps/server/src/modules/gas/gas.controller.ts
import { Elysia, t } from 'elysia';
import { authPlugin } from '../../plugins/better-auth';

export const gasController = new Elysia({ prefix: '/gas' })
  .use(authPlugin)
  
  // Daily Entries
  .post('/units/:unitId/entries', async ({ params, body, user, db }) => {
    // Create entry with auto-calculation
  }, {
    params: t.Object({ unitId: t.String() }),
    body: t.Object({
      date: t.String(),
      atomizerScheduled: t.Boolean(),
      atomizerHours: t.Number({ minimum: 0, maximum: 24 }),
      atomizerSecScheduled: t.Optional(t.Boolean()),
      atomizerSecHours: t.Optional(t.Number({ minimum: 0, maximum: 24 })),
      lineStatuses: t.Array(t.Object({
        equipmentId: t.String(),
        status: t.Union([t.Literal('ON'), t.Literal('OFF')]),
      })),
      observations: t.Optional(t.String()),
      qdsManual: t.Optional(t.Number()),
    }),
  })
  
  .get('/units/:unitId/entries', async ({ params, query, db }) => {
    // Get entries for a month
  }, {
    params: t.Object({ unitId: t.String() }),
    query: t.Object({ month: t.String() }), // YYYY-MM
  })
  
  // Consolidated calculations
  .get('/consolidated', async ({ query, db }) => {
    // Get consolidated data for all units
  }, {
    query: t.Object({ month: t.String() }),
  })
  
  // Reports
  .get('/reports/petrobras', async ({ query, db }) => {
    // Generate Petrobras export
  }, {
    query: t.Object({ month: t.String() }),
  });
```

---

## 6. Frontend Routes (TanStack Router)

```typescript
// apps/web/src/routes/gas/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/gas/')({
  component: GasDashboard,
});

// apps/web/src/routes/gas/units/$unitId/entries.tsx
export const Route = createFileRoute('/gas/units/$unitId/entries')({
  component: UnitEntryForm,
});

// apps/web/src/routes/gas/units/$unitId/entries/$date.tsx
export const Route = createFileRoute('/gas/units/$unitId/entries/$date')({
  component: EditEntryForm,
});

// apps/web/src/routes/gas/reports.tsx
export const Route = createFileRoute('/gas/reports')({
  component: ReportsPage,
});

// apps/web/src/routes/gas/admin.tsx
export const Route = createFileRoute('/gas/admin')({
  component: AdminPage,
});
```

---

## 7. User Stories

### US-001: Daily Data Entry
**As a** Unit Operator  
**I want to** enter daily gas consumption data for my unit  
**So that** the system can track and calculate consumption  

**Acceptance Criteria:**
- Can select/auto-populate today's date
- Can toggle atomizer on/off and enter operating hours (0-24)
- Can toggle each production line on/off
- See calculated QDS value update in real-time
- Can optionally override calculated value with manual entry
- Can add observations
- Entry saved with audit trail

### US-002: View Consolidated Dashboard
**As an** Engineering Manager  
**I want to** view consolidated consumption data across all units  
**So that** I can monitor contract compliance  

**Acceptance Criteria:**
- See daily summary with QDC, QDS, QDP, QDR
- Visual indicators for tolerance band status
- Monthly trend chart
- Filter by date range
- See status (OK/NOK) for each day

### US-003: Export Petrobras Report
**As a** Petrobras Liaison  
**I want to** export monthly consumption data in Petrobras format  
**So that** I can submit required reports  

**Acceptance Criteria:**
- Select month to export
- Preview data before export
- Download as XLSX with correct format
- Filename follows pattern: RC_{MONTH}_{YEAR}_Petrobras.xlsx

### US-004: Receive Missing Entry Alert
**As a** Unit Operator  
**I want to** receive email alerts when I haven't submitted daily data  
**So that** I don't forget to enter consumption data  

**Acceptance Criteria:**
- Email sent at 6 PM if entry not submitted
- Email contains unit name and date
- Link to entry form in email
- Escalation to supervisor after 2 hours

### US-005: Configure Equipment Constants
**As a** System Administrator  
**I want to** update equipment consumption rates  
**So that** calculations reflect current operational parameters  

**Acceptance Criteria:**
- Can update consumption rate for any equipment
- Must set effective date for changes
- Can add notes explaining the change
- Historical constants preserved for audit

---

## 8. Implementation Phases

### Phase 1: Infrastructure Setup (Week 1-2)
- [ ] Add ZenStack models to schema.zmodel
- [ ] Run db:generate and db:push
- [ ] Create seed script for units and equipment
- [ ] Set up gas module structure in server

### Phase 2: Core Entry Module (Week 3-4)
- [ ] Implement GasCalculationService
- [ ] Create daily entry API endpoints
- [ ] Build unit entry form component (Base UI)
- [ ] Add form validation and auto-calculation

### Phase 3: Dashboard & Reports (Week 5-6)
- [ ] Create consolidated dashboard route
- [ ] Implement summary cards with Base UI
- [ ] Add tolerance band visualization
- [ ] Build Petrobras export functionality

### Phase 4: Notifications (Week 7)
- [ ] Create react-email templates
- [ ] Implement NotificationService with Resend
- [ ] Set up scheduled jobs for alerts
- [ ] Add notification preferences to user settings

---

## 9. Equipment Constants (Seed Data)

### Criciúma (CRI)
| Equipment | Type | Rate | Unit |
|-----------|------|------|------|
| Atomizador | ATOMIZER | 1,350 | m³/h |
| Linha 0 | PRODUCTION_LINE | 24,000 | m³/d |
| Linha 1 | PRODUCTION_LINE | 5,500 | m³/d |
| Linha 2 | PRODUCTION_LINE | 5,500 | m³/d |
| Linha 3 | PRODUCTION_LINE | 6,500 | m³/d |
| Linha 4 | PRODUCTION_LINE | 6,500 | m³/d |
| Linha 5 | PRODUCTION_LINE | 7,000 | m³/d |
| Linha 6 | PRODUCTION_LINE | 12,500 | m³/d |
| Linha 7 | PRODUCTION_LINE | 12,500 | m³/d |

### Urussanga (URU)
| Equipment | Type | Rate | Unit |
|-----------|------|------|------|
| Atomizador | ATOMIZER | 955 | m³/h |
| Linha 1 | PRODUCTION_LINE | 13,000 | m³/d |
| Linha 2 | PRODUCTION_LINE | 23,000 | m³/d |

### Botucatu (BOT)
| Equipment | Type | Rate | Unit |
|-----------|------|------|------|
| ATM 250 | ATOMIZER | 1,300 | m³/h |
| ATM 052 | ATOMIZER | 435 | m³/h |
| Linha 1 | PRODUCTION_LINE | 23,000 | m³/d |
| Linha 2 | PRODUCTION_LINE | 25,500 | m³/d |
| Secador 2 | DRYER | 2,750 | m³/d |

### Default Contract
| Parameter | Value |
|-----------|-------|
| QDC Limit | 134,800 m³/d |
| Transport Min | 0.8 (80%) |
| Transport Max | 1.1 (110%) |
| Molecule Min | 0.95 (95%) |
| Molecule Max | 1.05 (105%) |
| Incentive Bonus | 1.2 (120%) |
| Incentive Penalty | 0.7 (70%) |

---

## 10. Glossary

| Term | Portuguese | Description |
|------|------------|-------------|
| QDC | Quantidade Diária Contratada | Contracted daily quantity (134,800 m³) |
| QDS | Quantidade Diária Solicitada | Requested/calculated daily quantity |
| QDP | Quantidade Diária Programada | Programmed/planned daily quantity |
| QDR | Quantidade Diária Real | Actual/real consumption (from meters) |
| ATM | Atomizador | Industrial atomizer equipment |
| RC | Relatório de Consumo | Consumption report |