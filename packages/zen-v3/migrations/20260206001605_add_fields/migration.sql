-- AlterTable
ALTER TABLE "gas_contracts" ADD COLUMN     "cmcMinUsagePercent" DOUBLE PRECISION,
ADD COLUMN     "overdemandTier1MaxPercent" DOUBLE PRECISION,
ADD COLUMN     "overdemandTier2MaxPercent" DOUBLE PRECISION,
ADD COLUMN     "overdemandTier2Multiplier" DOUBLE PRECISION,
ADD COLUMN     "overdemandTier3Multiplier" DOUBLE PRECISION,
ADD COLUMN     "penaltyFormulasJson" TEXT,
ADD COLUMN     "pvemaTolerancePercent" DOUBLE PRECISION,
ADD COLUMN     "pvemeTolerancePercent" DOUBLE PRECISION,
ADD COLUMN     "tusdTariffPerUnit" DOUBLE PRECISION;
