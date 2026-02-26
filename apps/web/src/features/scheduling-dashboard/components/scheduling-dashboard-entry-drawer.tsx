"use no memo";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";

import { api } from "~/clients/api-client";
import { DailyEntryForm } from "~/components/gas";
import { useSchedulingDashboard } from "./scheduling-dashboard-provider";

export function SchedulingDashboardEntryDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    selectedUnitId,
    setSelectedUnitId,
    selectedDate,
  } = useSchedulingDashboard();
  const queryClient = useQueryClient();

  const isOpen = drawerOpen === "create-entry" && selectedUnitId !== null;

  const { data: unitsData } = useQuery({
    queryKey: ["gas", "units"],
    queryFn: async () => {
      const response = await api.gas.units.get();
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(errorObj.error ?? "Failed to fetch units");
      }
      return response.data;
    },
    enabled: isOpen,
  });

  const selectedUnit = unitsData?.units?.find((u) => u.id === selectedUnitId);

  const submitMutation = useMutation({
    mutationFn: async ({
      unitId,
      ...body
    }: {
      unitId: string;
      date: string;
      atomizerScheduled?: boolean;
      atomizerHours?: number;
      secondaryAtomizerScheduled?: boolean;
      secondaryAtomizerHours?: number;
      qdsManual?: number;
      observations?: string;
      lineStatuses?: Array<{ equipmentId: string; status: "on" | "off" }>;
    }) => {
      const response = await api.gas.units({ unitId }).entries.post(body);
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(errorObj.error ?? "Failed to create entry");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Programação salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["GasDailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["gasDailyPlan"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const handleClose = () => {
    setDrawerOpen(null);
    setSelectedUnitId(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader className="text-start">
          <SheetTitle>Programar {selectedUnit?.name ?? "Unidade"}</SheetTitle>
          <SheetDescription>
            Configure equipamentos e registre a programação diária de gás para{" "}
            {format(selectedDate, "dd/MM/yyyy")}.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-4 py-6">
          {selectedUnit ? (
            <DailyEntryForm
              unit={selectedUnit}
              defaultValues={{ date: selectedDate }}
              isSubmitting={submitMutation.isPending}
              onSubmit={async (data) => {
                const dateStr = `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, "0")}-${String(data.date.getDate()).padStart(2, "0")}`;

                const lineStatuses = Object.entries(data.lineStatuses).map(
                  ([equipmentId, status]) => ({ equipmentId, status }),
                );

                await submitMutation.mutateAsync({
                  unitId: selectedUnit.id,
                  date: dateStr,
                  atomizerScheduled: data.atomizerScheduled,
                  atomizerHours: data.atomizerHours,
                  secondaryAtomizerScheduled: data.secondaryAtomizerScheduled,
                  secondaryAtomizerHours: data.secondaryAtomizerHours,
                  lineStatuses,
                  observations: data.observations || undefined,
                  qdsManual: data.qdsManualOverride
                    ? data.qdsManualValue
                    : undefined,
                });
              }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Carregando dados da unidade...
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
