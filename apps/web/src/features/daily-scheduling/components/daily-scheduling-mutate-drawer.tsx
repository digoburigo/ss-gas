import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { DailySchedulingForm } from "./daily-scheduling-form";
import { useDailyScheduling } from "./daily-scheduling-provider";

export function DailySchedulingMutateDrawer() {
  const { open, setOpen, currentRow, setCurrentRow } = useDailyScheduling();
  const client = useClientQueries(schema);

  const isOpen = open === "create" || open === "update";
  const isUpdate = open === "update";

  const { mutate: createPlan, isPending: isCreating } =
    client.gasDailyPlan.useCreate({
      onSuccess: () => {
        toast.success("Programação criada com sucesso!");
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        console.error("Error creating daily plan:", error);
        toast.error("Erro ao criar programação. Tente novamente.");
      },
    });

  const { mutate: updatePlan, isPending: isUpdating } =
    client.gasDailyPlan.useUpdate({
      onSuccess: () => {
        toast.success("Programação atualizada com sucesso!");
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        console.error("Error updating daily plan:", error);
        toast.error("Erro ao atualizar programação. Tente novamente.");
      },
    });

  const handleSubmit = (data: {
    unitId: string;
    date: string;
    qdpValue: number;
    volumeUnit: string;
    notes: string;
  }) => {
    const payload = {
      unitId: data.unitId,
      date: new Date(data.date),
      qdpValue: data.qdpValue,
      notes: data.notes || null,
    };

    if (isUpdate && currentRow) {
      updatePlan({
        where: { id: currentRow.id },
        data: payload,
      });
    } else {
      createPlan({
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
            {isUpdate ? "Editar Programação" : "Nova Programação Diária"}
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Atualize os dados da programação de consumo."
              : "Registre a programação diária de volume de gás para declarar à distribuidora."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-4 py-6">
          <DailySchedulingForm
            defaultValues={
              currentRow
                ? {
                    unitId: currentRow.unitId,
                    date: new Date(currentRow.date).toISOString().split("T")[0],
                    qdpValue: currentRow.qdpValue,
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
