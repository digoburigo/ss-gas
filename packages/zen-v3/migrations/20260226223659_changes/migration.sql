-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'login';
ALTER TYPE "AuditAction" ADD VALUE 'logout';

-- AlterTable
ALTER TABLE "gas_audit_logs" ADD COLUMN     "metadata" TEXT;

-- CreateTable
CREATE TABLE "gas_unit_contracts" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "unitId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gas_unit_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gas_unit_contracts_unitId_contractId_key" ON "gas_unit_contracts"("unitId", "contractId");

-- AddForeignKey
ALTER TABLE "gas_unit_contracts" ADD CONSTRAINT "gas_unit_contracts_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "gas_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gas_unit_contracts" ADD CONSTRAINT "gas_unit_contracts_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "gas_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
