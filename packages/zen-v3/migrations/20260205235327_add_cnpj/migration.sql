/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `organization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GasUserProfile" AS ENUM ('admin', 'manager', 'operator', 'viewer');

-- CreateEnum
CREATE TYPE "GasAlertEventType" AS ENUM ('contract_expiration', 'renewal_deadline', 'daily_scheduling', 'monthly_declaration', 'adjustment_date', 'take_or_pay_expiration', 'make_up_gas_expiration', 'custom');

-- CreateEnum
CREATE TYPE "GasAlertRecurrence" AS ENUM ('once', 'daily', 'weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "GasParameterCategory" AS ENUM ('alert_thresholds', 'penalty_formulas', 'business_rules', 'contract_templates', 'custom_fields');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete');

-- AlterTable
ALTER TABLE "gas_contracts" ADD COLUMN     "adjustmentBaseDate" TIMESTAMP(3),
ADD COLUMN     "adjustmentFrequency" TEXT,
ADD COLUMN     "adjustmentIndex" TEXT,
ADD COLUMN     "basePricePerUnit" DOUBLE PRECISION,
ADD COLUMN     "contractNumber" TEXT,
ADD COLUMN     "dailySchedulingDeadline" TEXT,
ADD COLUMN     "flexibilityDownPercent" DOUBLE PRECISION,
ADD COLUMN     "flexibilityUpPercent" DOUBLE PRECISION,
ADD COLUMN     "latePaymentInterestPercent" DOUBLE PRECISION,
ADD COLUMN     "latePaymentPenaltyPercent" DOUBLE PRECISION,
ADD COLUMN     "makeUpGasEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "makeUpGasExpirationMonths" INTEGER,
ADD COLUMN     "makeUpGasMaxPercent" DOUBLE PRECISION,
ADD COLUMN     "monthlyDeclarationDeadline" INTEGER,
ADD COLUMN     "nextAdjustmentDate" TIMESTAMP(3),
ADD COLUMN     "penaltyCalculationMethod" TEXT,
ADD COLUMN     "penaltyForOverConsumption" DOUBLE PRECISION,
ADD COLUMN     "penaltyForUnderConsumption" DOUBLE PRECISION,
ADD COLUMN     "priceCurrency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "renewalDate" TIMESTAMP(3),
ADD COLUMN     "renewalNoticeDays" INTEGER,
ADD COLUMN     "seasonalFlexibility" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supplier" TEXT,
ADD COLUMN     "supplierCnpj" TEXT,
ADD COLUMN     "takeOrPayAccumulationMonths" INTEGER,
ADD COLUMN     "takeOrPayExpirationMonths" INTEGER,
ADD COLUMN     "takeOrPayPercent" DOUBLE PRECISION,
ADD COLUMN     "taxesIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportCostPerUnit" DOUBLE PRECISION,
ADD COLUMN     "volumeUnit" TEXT NOT NULL DEFAULT 'm3';

-- AlterTable
ALTER TABLE "gas_units" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "responsibleEmails" TEXT[],
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "member" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedById" TEXT,
ADD COLUMN     "profile" "GasUserProfile" NOT NULL DEFAULT 'viewer';

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "gas_contract_audit_logs" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "contractId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userName" TEXT,

    CONSTRAINT "gas_contract_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_unit_operators" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "memberId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "notes" TEXT,

    CONSTRAINT "gas_unit_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_contract_alerts" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "contractId" TEXT NOT NULL,
    "eventType" "GasAlertEventType" NOT NULL DEFAULT 'custom',
    "eventName" TEXT NOT NULL,
    "eventDescription" TEXT,
    "eventDate" TIMESTAMP(3),
    "eventTime" TEXT,
    "recurrence" "GasAlertRecurrence" NOT NULL DEFAULT 'once',
    "advanceNoticeDays" INTEGER[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "gas_contract_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_contract_alert_recipients" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "alertId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gas_contract_alert_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_alert_sent_logs" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "alertId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "advanceNoticeDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "errorMessage" TEXT,

    CONSTRAINT "gas_alert_sent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_system_parameters" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "category" "GasParameterCategory" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" TEXT NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'number',
    "contractType" TEXT,
    "defaultValue" TEXT,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "gas_system_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_contract_templates" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contractType" TEXT,
    "templateValues" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "gas_contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_custom_fields" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "fieldName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "entityType" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "gas_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_audit_logs" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "action" "AuditAction" NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changes" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT,

    CONSTRAINT "gas_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gas_contract_audit_logs_contractId_idx" ON "gas_contract_audit_logs"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "gas_unit_operators_memberId_unitId_key" ON "gas_unit_operators"("memberId", "unitId");

-- CreateIndex
CREATE INDEX "gas_contract_alerts_contractId_idx" ON "gas_contract_alerts"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "gas_contract_alert_recipients_alertId_email_key" ON "gas_contract_alert_recipients"("alertId", "email");

-- CreateIndex
CREATE INDEX "gas_alert_sent_logs_alertId_idx" ON "gas_alert_sent_logs"("alertId");

-- CreateIndex
CREATE INDEX "gas_alert_sent_logs_sentAt_idx" ON "gas_alert_sent_logs"("sentAt");

-- CreateIndex
CREATE INDEX "gas_system_parameters_organizationId_category_idx" ON "gas_system_parameters"("organizationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "gas_system_parameters_organizationId_category_key_key" ON "gas_system_parameters"("organizationId", "category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "gas_contract_templates_organizationId_name_key" ON "gas_contract_templates"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "gas_custom_fields_organizationId_entityType_fieldName_key" ON "gas_custom_fields"("organizationId", "entityType", "fieldName");

-- CreateIndex
CREATE INDEX "gas_audit_logs_organizationId_idx" ON "gas_audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "gas_audit_logs_entityType_idx" ON "gas_audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "gas_audit_logs_entityId_idx" ON "gas_audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "gas_audit_logs_userId_idx" ON "gas_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "gas_audit_logs_createdAt_idx" ON "gas_audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "organization_cnpj_key" ON "organization"("cnpj");

-- AddForeignKey
ALTER TABLE "gas_units" ADD CONSTRAINT "gas_units_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "gas_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_contract_audit_logs" ADD CONSTRAINT "gas_contract_audit_logs_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "gas_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_unit_operators" ADD CONSTRAINT "gas_unit_operators_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_unit_operators" ADD CONSTRAINT "gas_unit_operators_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "gas_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_contract_alerts" ADD CONSTRAINT "gas_contract_alerts_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "gas_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_contract_alert_recipients" ADD CONSTRAINT "gas_contract_alert_recipients_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "gas_contract_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_alert_sent_logs" ADD CONSTRAINT "gas_alert_sent_logs_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "gas_contract_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_system_parameters" ADD CONSTRAINT "gas_system_parameters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_contract_templates" ADD CONSTRAINT "gas_contract_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_custom_fields" ADD CONSTRAINT "gas_custom_fields_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_audit_logs" ADD CONSTRAINT "gas_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
