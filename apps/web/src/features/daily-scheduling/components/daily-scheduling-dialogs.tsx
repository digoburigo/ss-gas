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

import { authClient } from "~/clients/auth-client";
import { DailySchedulingMutateDrawer } from "./daily-scheduling-mutate-drawer";
import { useDailyScheduling } from "./daily-scheduling-provider";

export function DailySchedulingDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useDailyScheduling();
  const client = useClientQueries(schema);
  const { data: session } = authClient.useSession();

  const { mutate: deletePlan, isPending: isDeleting } =
    client.gasDailyPlan.useDelete({
      onSuccess: () => {
        toast.success("Programação excluída com sucesso!");
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        console.error("Error deleting daily plan:", error);
        toast.error("Erro ao excluir programação. Tente novamente.");
      },
    });

  const { mutate: updatePlan, isPending: isUpdating } =
    client.gasDailyPlan.useUpdate({
      onSuccess: () => {
        toast.success("Programação enviada para a distribuidora com sucesso!");
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        console.error("Error submitting daily plan:", error);
        toast.error("Erro ao enviar programação. Tente novamente.");
      },
    });

  const handleDelete = () => {
    if (!currentRow) return;
    deletePlan({ where: { id: currentRow.id } });
  };

  const handleSubmitToDistributor = () => {
    if (!currentRow) return;
    updatePlan({
      where: { id: currentRow.id },
      data: {
        submitted: true,
        submittedAt: new Date(),
        submittedById: session?.user?.id,
      },
    });
  };

  return (
    <>
      {/* Create/Update Drawer */}
      <DailySchedulingMutateDrawer />

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
            <AlertDialogTitle>Excluir Programação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta programação? Esta ação não
              pode ser desfeita.
              {currentRow && (
                <div className="bg-muted mt-4 rounded-md p-3 text-sm">
                  <div>
                    <strong>Data:</strong>{" "}
                    {new Date(currentRow.date).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </div>
                  <div>
                    <strong>Volume:</strong>{" "}
                    {currentRow.qdpValue.toLocaleString("pt-BR")}
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

      {/* Submit to Distributor Confirmation Dialog */}
      <AlertDialog
        open={open === "submit-to-distributor"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null);
            setCurrentRow(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar para Distribuidora</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja enviar esta programação para a distribuidora? Após o envio,
              a programação não poderá mais ser editada.
              {currentRow && (
                <div className="bg-muted mt-4 rounded-md p-3 text-sm">
                  <div>
                    <strong>Data:</strong>{" "}
                    {new Date(currentRow.date).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </div>
                  <div>
                    <strong>Volume Programado:</strong>{" "}
                    {currentRow.qdpValue.toLocaleString("pt-BR")}
                  </div>
                  {currentRow.notes && (
                    <div>
                      <strong>Observações:</strong> {currentRow.notes}
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitToDistributor}>
              {isUpdating ? "Enviando..." : "Confirmar Envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
