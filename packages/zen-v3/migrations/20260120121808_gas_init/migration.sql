-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('atomizer', 'line', 'dryer');

-- CreateEnum
CREATE TYPE "ConsumptionUnit" AS ENUM ('m3_per_hour', 'm3_per_day');

-- CreateEnum
CREATE TYPE "LineStatusValue" AS ENUM ('on', 'off');

-- CreateEnum
CREATE TYPE "ConsumptionSource" AS ENUM ('calculated', 'meter', 'manual');

-- CreateTable
CREATE TABLE "gas_units" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "gas_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_equipment" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "unitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gas_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_equipment_constants" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "equipmentId" TEXT NOT NULL,
    "consumptionRate" DOUBLE PRECISION NOT NULL,
    "consumptionUnit" "ConsumptionUnit" NOT NULL DEFAULT 'm3_per_hour',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "gas_equipment_constants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_daily_entries" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "unitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "atomizerScheduled" BOOLEAN NOT NULL DEFAULT true,
    "atomizerHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "secondaryAtomizerScheduled" BOOLEAN,
    "secondaryAtomizerHours" DOUBLE PRECISION,
    "qdcAtomizer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qdcLines" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qdsCalculated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qdsManual" DOUBLE PRECISION,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "gas_daily_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_line_statuses" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "entryId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "status" "LineStatusValue" NOT NULL DEFAULT 'off',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gas_line_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_daily_plans" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "unitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "qdpValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "approved" BOOLEAN,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gas_daily_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_real_consumptions" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "unitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "qdrValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" "ConsumptionSource" NOT NULL DEFAULT 'meter',
    "meterReading" DOUBLE PRECISION,
    "previousMeterReading" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gas_real_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_contracts" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "qdcContracted" DOUBLE PRECISION NOT NULL,
    "transportToleranceUpperPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "transportToleranceLowerPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "moleculeTolerancePercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "gas_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "userId" TEXT NOT NULL,
    "missingEntryAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredNotificationHour" INTEGER NOT NULL DEFAULT 18,
    "escalationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "escalationDelayHours" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gas_units_organizationId_code_key" ON "gas_units"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "gas_equipment_unitId_code_key" ON "gas_equipment"("unitId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "gas_daily_entries_unitId_date_key" ON "gas_daily_entries"("unitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "gas_line_statuses_entryId_equipmentId_key" ON "gas_line_statuses"("entryId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "gas_daily_plans_unitId_date_key" ON "gas_daily_plans"("unitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "gas_real_consumptions_unitId_date_key" ON "gas_real_consumptions"("unitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_userId_key" ON "user_notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "gas_units" ADD CONSTRAINT "gas_units_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_equipment" ADD CONSTRAINT "gas_equipment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "gas_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_equipment_constants" ADD CONSTRAINT "gas_equipment_constants_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "gas_equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_equipment_constants" ADD CONSTRAINT "gas_equipment_constants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_daily_entries" ADD CONSTRAINT "gas_daily_entries_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "gas_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_daily_entries" ADD CONSTRAINT "gas_daily_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_daily_entries" ADD CONSTRAINT "gas_daily_entries_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_line_statuses" ADD CONSTRAINT "gas_line_statuses_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "gas_daily_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_line_statuses" ADD CONSTRAINT "gas_line_statuses_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "gas_equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_daily_plans" ADD CONSTRAINT "gas_daily_plans_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "gas_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_daily_plans" ADD CONSTRAINT "gas_daily_plans_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_daily_plans" ADD CONSTRAINT "gas_daily_plans_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_daily_plans" ADD CONSTRAINT "gas_daily_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_real_consumptions" ADD CONSTRAINT "gas_real_consumptions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "gas_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_real_consumptions" ADD CONSTRAINT "gas_real_consumptions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_contracts" ADD CONSTRAINT "gas_contracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_contracts" ADD CONSTRAINT "gas_contracts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
