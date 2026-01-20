import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import type { GasContract } from "@acme/zen-v3/zenstack/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { ContractForm } from "./contract-form";

type ContractsMutateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: GasContract;
};

export function ContractsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ContractsMutateDrawerProps) {
  const isUpdate = !!currentRow;
  const client = useClientQueries(schema);
  const { data: session } = authClient.useSession();

  const { mutate: createContract, isPending: isCreating } =
    client.gasContract.useCreate({
      onSuccess: () => {
        toast.success("Contrato criado com sucesso");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutate: updateContract, isPending: isUpdating } =
    client.gasContract.useUpdate({
      onSuccess: () => {
        toast.success("Contrato atualizado com sucesso");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Mutations for audit log
  const { mutateAsync: createAuditLog } =
    client.gasContractAuditLog.useCreate();

  // Mutation for updating unit contract linkage
  const { mutateAsync: updateUnit } = client.gasUnit.useUpdate();

  const handleSubmit = async (data: {
    name: string;
    contractNumber: string;
    supplier: string;
    supplierCnpj: string;
    qdcContracted: number;
    volumeUnit: string;
    transportToleranceUpperPercent: number;
    transportToleranceLowerPercent: number;
    moleculeTolerancePercent: number;
    takeOrPayPercent: number | null;
    takeOrPayAccumulationMonths: number | null;
    takeOrPayExpirationMonths: number | null;
    makeUpGasEnabled: boolean;
    makeUpGasExpirationMonths: number | null;
    makeUpGasMaxPercent: number | null;
    flexibilityUpPercent: number | null;
    flexibilityDownPercent: number | null;
    seasonalFlexibility: boolean;
    basePricePerUnit: number | null;
    priceCurrency: string;
    adjustmentIndex: string;
    adjustmentFrequency: string;
    adjustmentBaseDate: string;
    nextAdjustmentDate: string;
    transportCostPerUnit: number | null;
    taxesIncluded: boolean;
    penaltyForUnderConsumption: number | null;
    penaltyForOverConsumption: number | null;
    penaltyCalculationMethod: string;
    latePaymentPenaltyPercent: number | null;
    latePaymentInterestPercent: number | null;
    effectiveFrom: string;
    effectiveTo: string;
    renewalDate: string;
    renewalNoticeDays: number | null;
    dailySchedulingDeadline: string;
    monthlyDeclarationDeadline: number | null;
    active: boolean;
    notes: string;
    unitIds: string[];
  }) => {
    const payload = {
      name: data.name,
      contractNumber: data.contractNumber || null,
      supplier: data.supplier || null,
      supplierCnpj: data.supplierCnpj || null,
      qdcContracted: data.qdcContracted,
      volumeUnit: data.volumeUnit,
      transportToleranceUpperPercent: data.transportToleranceUpperPercent,
      transportToleranceLowerPercent: data.transportToleranceLowerPercent,
      moleculeTolerancePercent: data.moleculeTolerancePercent,
      takeOrPayPercent: data.takeOrPayPercent,
      takeOrPayAccumulationMonths: data.takeOrPayAccumulationMonths,
      takeOrPayExpirationMonths: data.takeOrPayExpirationMonths,
      makeUpGasEnabled: data.makeUpGasEnabled,
      makeUpGasExpirationMonths: data.makeUpGasExpirationMonths,
      makeUpGasMaxPercent: data.makeUpGasMaxPercent,
      flexibilityUpPercent: data.flexibilityUpPercent,
      flexibilityDownPercent: data.flexibilityDownPercent,
      seasonalFlexibility: data.seasonalFlexibility,
      basePricePerUnit: data.basePricePerUnit,
      priceCurrency: data.priceCurrency,
      adjustmentIndex: data.adjustmentIndex || null,
      adjustmentFrequency: data.adjustmentFrequency || null,
      adjustmentBaseDate: data.adjustmentBaseDate
        ? new Date(data.adjustmentBaseDate)
        : null,
      nextAdjustmentDate: data.nextAdjustmentDate
        ? new Date(data.nextAdjustmentDate)
        : null,
      transportCostPerUnit: data.transportCostPerUnit,
      taxesIncluded: data.taxesIncluded,
      penaltyForUnderConsumption: data.penaltyForUnderConsumption,
      penaltyForOverConsumption: data.penaltyForOverConsumption,
      penaltyCalculationMethod: data.penaltyCalculationMethod || null,
      latePaymentPenaltyPercent: data.latePaymentPenaltyPercent,
      latePaymentInterestPercent: data.latePaymentInterestPercent,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      renewalNoticeDays: data.renewalNoticeDays,
      dailySchedulingDeadline: data.dailySchedulingDeadline || null,
      monthlyDeclarationDeadline: data.monthlyDeclarationDeadline,
      active: data.active,
      notes: data.notes || null,
    };

    if (isUpdate && currentRow) {
      updateContract(
        {
          data: payload,
          where: { id: currentRow.id },
        },
        {
          onSuccess: async () => {
            // Create audit log entry for update
            await createAuditLog({
              data: {
                contractId: currentRow.id,
                action: "update",
                field: null,
                oldValue: JSON.stringify(currentRow),
                newValue: JSON.stringify(payload),
                userId: session?.user?.id || null,
                userName: session?.user?.name || null,
              },
            });

            // Update unit linkages
            const currentUnitIds = currentRow.units?.map((u) => u.id) || [];
            const newUnitIds = data.unitIds;

            // Remove contract from units no longer linked
            for (const unitId of currentUnitIds) {
              if (!newUnitIds.includes(unitId)) {
                await updateUnit({
                  where: { id: unitId },
                  data: { contractId: null },
                });
              }
            }

            // Add contract to newly linked units
            for (const unitId of newUnitIds) {
              if (!currentUnitIds.includes(unitId)) {
                await updateUnit({
                  where: { id: unitId },
                  data: { contractId: currentRow.id },
                });
              }
            }
          },
        },
      );
    } else {
      createContract(
        {
          data: payload,
        },
        {
          onSuccess: async (createdContract) => {
            // Create audit log entry for creation
            await createAuditLog({
              data: {
                contractId: createdContract.id,
                action: "create",
                field: null,
                oldValue: null,
                newValue: JSON.stringify(payload),
                userId: session?.user?.id || null,
                userName: session?.user?.name || null,
              },
            });

            // Link units to the new contract
            for (const unitId of data.unitIds) {
              await updateUnit({
                where: { id: unitId },
                data: { contractId: createdContract.id },
              });
            }
          },
        },
      );
    }
  };

  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="text-start">
          <SheetTitle>{isUpdate ? "Editar" : "Criar"} Contrato</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Atualize as informações do contrato de gás natural."
              : "Adicione um novo contrato de gás natural preenchendo as informações abaixo."}{" "}
            Clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-4 py-6">
          <ContractForm
            defaultValues={
              currentRow
                ? {
                    name: currentRow.name,
                    contractNumber: currentRow.contractNumber ?? "",
                    supplier: currentRow.supplier ?? "",
                    supplierCnpj: currentRow.supplierCnpj ?? "",
                    qdcContracted: currentRow.qdcContracted,
                    volumeUnit: currentRow.volumeUnit,
                    transportToleranceUpperPercent:
                      currentRow.transportToleranceUpperPercent,
                    transportToleranceLowerPercent:
                      currentRow.transportToleranceLowerPercent,
                    moleculeTolerancePercent:
                      currentRow.moleculeTolerancePercent,
                    takeOrPayPercent: currentRow.takeOrPayPercent,
                    takeOrPayAccumulationMonths:
                      currentRow.takeOrPayAccumulationMonths,
                    takeOrPayExpirationMonths:
                      currentRow.takeOrPayExpirationMonths,
                    makeUpGasEnabled: currentRow.makeUpGasEnabled,
                    makeUpGasExpirationMonths:
                      currentRow.makeUpGasExpirationMonths,
                    makeUpGasMaxPercent: currentRow.makeUpGasMaxPercent,
                    flexibilityUpPercent: currentRow.flexibilityUpPercent,
                    flexibilityDownPercent: currentRow.flexibilityDownPercent,
                    seasonalFlexibility: currentRow.seasonalFlexibility,
                    basePricePerUnit: currentRow.basePricePerUnit,
                    priceCurrency: currentRow.priceCurrency,
                    adjustmentIndex: currentRow.adjustmentIndex ?? "",
                    adjustmentFrequency: currentRow.adjustmentFrequency ?? "",
                    adjustmentBaseDate: formatDateForInput(
                      currentRow.adjustmentBaseDate,
                    ),
                    nextAdjustmentDate: formatDateForInput(
                      currentRow.nextAdjustmentDate,
                    ),
                    transportCostPerUnit: currentRow.transportCostPerUnit,
                    taxesIncluded: currentRow.taxesIncluded,
                    penaltyForUnderConsumption:
                      currentRow.penaltyForUnderConsumption,
                    penaltyForOverConsumption:
                      currentRow.penaltyForOverConsumption,
                    penaltyCalculationMethod:
                      currentRow.penaltyCalculationMethod ?? "",
                    latePaymentPenaltyPercent:
                      currentRow.latePaymentPenaltyPercent,
                    latePaymentInterestPercent:
                      currentRow.latePaymentInterestPercent,
                    effectiveFrom: formatDateForInput(currentRow.effectiveFrom),
                    effectiveTo: formatDateForInput(currentRow.effectiveTo),
                    renewalDate: formatDateForInput(currentRow.renewalDate),
                    renewalNoticeDays: currentRow.renewalNoticeDays,
                    dailySchedulingDeadline:
                      currentRow.dailySchedulingDeadline ?? "",
                    monthlyDeclarationDeadline:
                      currentRow.monthlyDeclarationDeadline,
                    active: currentRow.active,
                    notes: currentRow.notes ?? "",
                    unitIds: currentRow.units?.map((u) => u.id) ?? [],
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={isCreating || isUpdating}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
