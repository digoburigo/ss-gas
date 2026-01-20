import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { ActualConsumptionMutateDrawer } from "./actual-consumption-mutate-drawer";
import { useActualConsumption } from "./actual-consumption-provider";

export function ActualConsumptionDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useActualConsumption();
  const client = useClientQueries(schema);

  const { mutate: deleteConsumption, isPending: isDeleting } =
    client.gasRealConsumption.useDelete({
      onSuccess: () => {
        toast.success("Registro de consumo excluído com sucesso!");
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        console.error("Error deleting consumption record:", error);
        toast.error("Erro ao excluir registro de consumo. Tente novamente.");
      },
    });

  const handleDelete = () => {
    if (!currentRow) return;
    deleteConsumption({ where: { id: currentRow.id } });
  };

  return (
    <>
      {/* Create/Update Drawer */}
      <ActualConsumptionMutateDrawer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={open === "delete"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null);
            setCurrentRow(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro de Consumo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de consumo? Esta ação
              não pode ser desfeita.
              {currentRow && (
                <div className="bg-muted mt-4 rounded-md p-3 text-sm">
                  <div>
                    <strong>Data:</strong>{" "}
                    {new Date(currentRow.date).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </div>
                  <div>
                    <strong>Volume Consumido:</strong>{" "}
                    {currentRow.qdrValue.toLocaleString("pt-BR", {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
