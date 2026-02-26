import { useQueryClient } from "@tanstack/react-query";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import type { GasUnit } from "@acme/zen-v3/zenstack/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { ConsumerUnitForm } from "./consumer-unit-form";

type ConsumerUnitsMutateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: GasUnit;
};

export function ConsumerUnitsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ConsumerUnitsMutateDrawerProps) {
  const isUpdate = !!currentRow;
  const client = useClientQueries(schema);
  const queryClient = useQueryClient();

  // Fetch existing unit contracts for the current unit (when editing)
  const unitIdForQuery = currentRow?.id ?? "";
  const { data: existingUnitContracts = [] } =
    client.gasUnitContract.useFindMany({
      where: { unitId: unitIdForQuery },
    });

  const { mutateAsync: createUnit, isPending: isCreating } =
    client.gasUnit.useCreate({
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutateAsync: updateUnit, isPending: isUpdating } =
    client.gasUnit.useUpdate({
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutateAsync: createUnitContract } = client.gasUnitContract.useCreate(
    {},
  );

  const { mutateAsync: deleteUnitContract } = client.gasUnitContract.useDelete(
    {},
  );

  const { mutateAsync: updateUnitContract } = client.gasUnitContract.useUpdate(
    {},
  );

  const handleSubmit = async (data: {
    code: string;
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    responsibleEmails: string[];
    contractId: string;
    contractIds: string[];
    primaryContractId: string;
    active: boolean;
  }) => {
    const payload = {
      code: data.code,
      name: data.name,
      description: data.description || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      responsibleEmails: data.responsibleEmails,
      contractId: data.contractId || null,
      active: data.active,
    };

    let unitId: string;

    if (isUpdate && currentRow) {
      await updateUnit({
        data: payload,
        where: { id: currentRow.id },
      });
      unitId = currentRow.id;
    } else {
      const result = await createUnit({ data: payload });
      unitId = result.id;
    }

    // Sync unit contracts (many-to-many)
    const existingIds = new Set(
      existingUnitContracts.map((uc) => uc.contractId),
    );
    const desiredIds = new Set(data.contractIds);

    // Delete removed contracts
    for (const uc of existingUnitContracts) {
      if (!desiredIds.has(uc.contractId)) {
        await deleteUnitContract({ where: { id: uc.id } });
      }
    }

    // Create new contracts
    for (const contractId of data.contractIds) {
      if (!existingIds.has(contractId)) {
        await createUnitContract({
          data: {
            unitId,
            contractId,
            isPrimary: contractId === data.primaryContractId,
          },
        });
      }
    }

    // Update isPrimary for existing contracts
    for (const uc of existingUnitContracts) {
      if (desiredIds.has(uc.contractId)) {
        const shouldBePrimary = uc.contractId === data.primaryContractId;
        if (uc.isPrimary !== shouldBePrimary) {
          await updateUnitContract({
            data: { isPrimary: shouldBePrimary },
            where: { id: uc.id },
          });
        }
      }
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["GasUnitContract"] });
    queryClient.invalidateQueries({ queryKey: ["gasUnitContract"] });
    queryClient.invalidateQueries({ queryKey: ["GasUnit"] });
    queryClient.invalidateQueries({ queryKey: ["gasUnit"] });

    toast.success(
      isUpdate
        ? "Unidade consumidora atualizada com sucesso"
        : "Unidade consumidora criada com sucesso",
    );
    onOpenChange(false);
  };

  // Build default values from existing unitContracts
  const existingContractIds = existingUnitContracts.map((uc) => uc.contractId);
  const primaryContract = existingUnitContracts.find((uc) => uc.isPrimary);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-start">
          <SheetTitle>
            {isUpdate ? "Editar" : "Criar"} Unidade Consumidora
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Atualize as informações da unidade consumidora."
              : "Adicione uma nova unidade consumidora (ponto de medição) preenchendo as informações abaixo."}{" "}
            Clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-4 py-6">
          <ConsumerUnitForm
            defaultValues={
              currentRow
                ? {
                    code: currentRow.code,
                    name: currentRow.name,
                    description: currentRow.description ?? "",
                    address: currentRow.address ?? "",
                    city: currentRow.city ?? "",
                    state: currentRow.state ?? "",
                    zipCode: currentRow.zipCode ?? "",
                    responsibleEmails: currentRow.responsibleEmails ?? [],
                    contractId: currentRow.contractId ?? "",
                    contractIds:
                      existingContractIds.length > 0
                        ? existingContractIds
                        : currentRow.contractId
                          ? [currentRow.contractId]
                          : [],
                    primaryContractId:
                      primaryContract?.contractId ??
                      currentRow.contractId ??
                      "",
                    active: currentRow.active,
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
