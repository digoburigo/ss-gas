-- CreateEnum
CREATE TYPE "TariffStatus" AS ENUM ('pending', 'approved', 'active', 'rejected');

-- CreateTable
CREATE TABLE "gas_contract_versions" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "contractId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "dataSnapshot" TEXT NOT NULL,
    "extractedDataSummary" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "gas_contract_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_tariff_history" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "contractId" TEXT NOT NULL,
    "tariffPerUnit" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "tusdTariff" DOUBLE PRECISION,
    "transportCost" DOUBLE PRECISION,
    "notes" TEXT,
    "status" "TariffStatus" NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "gas_tariff_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gas_contract_versions_contractId_idx" ON "gas_contract_versions"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "gas_contract_versions_contractId_versionNumber_key" ON "gas_contract_versions"("contractId", "versionNumber");

-- CreateIndex
CREATE INDEX "gas_tariff_history_contractId_effectiveFrom_idx" ON "gas_tariff_history"("contractId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "gas_tariff_history_organizationId_idx" ON "gas_tariff_history"("organizationId");

-- AddForeignKey
ALTER TABLE "gas_contract_versions" ADD CONSTRAINT "gas_contract_versions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "gas_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_contract_versions" ADD CONSTRAINT "gas_contract_versions_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_contract_versions" ADD CONSTRAINT "gas_contract_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_tariff_history" ADD CONSTRAINT "gas_tariff_history_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "gas_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_tariff_history" ADD CONSTRAINT "gas_tariff_history_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_tariff_history" ADD CONSTRAINT "gas_tariff_history_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_tariff_history" ADD CONSTRAINT "gas_tariff_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
