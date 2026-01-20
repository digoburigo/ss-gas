import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import type { ConsumptionSource } from "@acme/zen-v3/zenstack/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { ActualConsumptionForm } from "./actual-consumption-form";
import { useActualConsumption } from "./actual-consumption-provider";

export function ActualConsumptionMutateDrawer() {
  const { open, setOpen, currentRow, setCurrentRow } = useActualConsumption();
  const client = useClientQueries(schema);

  const isOpen = open === "create" || open === "update";
  const isUpdate = open === "update";

  const { mutate: createConsumption, isPending: isCreating } =
    client.gasRealConsumption.useCreate({
      onSuccess: () => {
        toast.success("Consumo registrado com sucesso!");
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        console.error("Error creating consumption record:", error);
        toast.error("Erro ao registrar consumo. Tente novamente.");
      },
    });

  const { mutate: updateConsumption, isPending: isUpdating } =
    client.gasRealConsumption.useUpdate({
      onSuccess: () => {
        toast.success("Registro de consumo atualizado com sucesso!");
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        console.error("Error updating consumption record:", error);
        toast.error("Erro ao atualizar registro de consumo. Tente novamente.");
      },
    });

  const handleSubmit = (data: {
    unitId: string;
    date: string;
    qdrValue: number;
    source: ConsumptionSource;
    meterReading: number | null;
    previousMeterReading: number | null;
    notes: string;
  }) => {
    const payload = {
      unitId: data.unitId,
      date: new Date(data.date),
      qdrValue: data.qdrValue,
      source: data.source,
      meterReading: data.meterReading,
      previousMeterReading: data.previousMeterReading,
      notes: data.notes || null,
    };

    if (isUpdate && currentRow) {
      updateConsumption({
        where: { id: currentRow.id },
        data: payload,
      });
    } else {
      createConsumption({
        data: payload,
      });
    }
  };

  const handleClose = () => {
    setOpen(null);
    setCurrentRow(null);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(openState) => !openState && handleClose()}
    >
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader className="text-start">
          <SheetTitle>
            {isUpdate ? "Editar Registro de Consumo" : "Registrar Consumo Real"}
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Atualize os dados do registro de consumo."
              : "Registre o consumo real medido para comparar com a programação."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-4 py-6">
          <ActualConsumptionForm
            defaultValues={
              currentRow
                ? {
                    unitId: currentRow.unitId,
                    date: new Date(currentRow.date).toISOString().split("T")[0],
                    qdrValue: currentRow.qdrValue,
                    source: currentRow.source,
                    meterReading: currentRow.meterReading,
                    previousMeterReading: currentRow.previousMeterReading,
                    notes: currentRow.notes ?? "",
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
