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

import { ContractAlertsMutateDrawer } from "./contract-alerts-mutate-drawer";
import { useContractAlerts } from "./contract-alerts-provider";

export function ContractAlertsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useContractAlerts();
  const client = useClientQueries(schema);

  const { mutate: deleteAlert, isPending: isDeleting } =
    client.gasContractAlert.useDelete({
      onSuccess: () => {
        toast.success("Alerta excluído com sucesso");
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutate: updateAlert, isPending: isUpdating } =
    client.gasContractAlert.useUpdate({
      onSuccess: () => {
        toast.success(
          `Alerta ${currentRow?.active ? "desativado" : "ativado"} com sucesso`,
        );
        setOpen(null);
        setCurrentRow(null);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleDelete = () => {
    if (!currentRow) return;
    deleteAlert({
      where: { id: currentRow.id },
    });
  };

  const handleToggleActive = () => {
    if (!currentRow) return;
    updateAlert({
      where: { id: currentRow.id },
      data: { active: !currentRow.active },
    });
  };

  return (
    <>
      {/* Create/Update Drawer */}
      <ContractAlertsMutateDrawer
        open={open === "create" || open === "update"}
        onOpenChange={(isOpen) => {
          setOpen(isOpen ? open : null);
          if (!isOpen) setCurrentRow(null);
        }}
        currentRow={open === "update" ? currentRow : null}
      />

      {/* Delete Dialog */}
      <AlertDialog
        open={open === "delete"}
        onOpenChange={(isOpen) => {
          setOpen(isOpen ? "delete" : null);
          if (!isOpen) setCurrentRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Alerta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o alerta{" "}
              <span className="font-medium">{currentRow?.eventName}</span>? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Active Dialog */}
      <AlertDialog
        open={open === "toggle-active"}
        onOpenChange={(isOpen) => {
          setOpen(isOpen ? "toggle-active" : null);
          if (!isOpen) setCurrentRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentRow?.active ? "Desativar" : "Ativar"} Alerta
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja{" "}
              {currentRow?.active ? "desativar" : "ativar"} o alerta{" "}
              <span className="font-medium">{currentRow?.eventName}</span>?
              {currentRow?.active
                ? " Nenhum email será enviado enquanto o alerta estiver desativado."
                : " Os emails serão enviados conforme configurado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={isUpdating}
            >
              {isUpdating
                ? "Processando..."
                : currentRow?.active
                  ? "Desativar"
                  : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
