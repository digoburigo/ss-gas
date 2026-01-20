import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { ContractUploadDrawer } from "./contract-upload-drawer";
import { ContractsMutateDrawer } from "./contracts-mutate-drawer";
import { useContracts } from "./contracts-provider";

export function ContractsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useContracts();
  const client = useClientQueries(schema);
  const { data: session } = authClient.useSession();

  const { mutateAsync: updateContract } = client.gasContract.useUpdate({
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutateAsync: deleteContract } = client.gasContract.useDelete({
    onSuccess: () => {
      toast.success("Contrato excluído com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutateAsync: createAuditLog } =
    client.gasContractAuditLog.useCreate();

  // Fetch audit logs for history dialog
  const { data: auditLogs = [] } = client.gasContractAuditLog.useFindMany(
    {
      where: { contractId: currentRow?.id },
      orderBy: { createdAt: "desc" },
    },
    {
      enabled: open === "view-history" && !!currentRow,
    },
  );

  const handleToggleActive = async () => {
    if (!currentRow) return;

    const newValue = !currentRow.active;
    await updateContract({
      data: {
        active: newValue,
      },
      where: { id: currentRow.id },
    });

    // Create audit log entry
    await createAuditLog({
      data: {
        contractId: currentRow.id,
        action: "update",
        field: "active",
        oldValue: String(currentRow.active),
        newValue: String(newValue),
        userId: session?.user?.id || null,
        userName: session?.user?.name || null,
      },
    });

    setOpen(null);
    setTimeout(() => {
      setCurrentRow(null);
    }, 500);
  };

  const handleDelete = async () => {
    if (!currentRow) return;

    // Create audit log entry before delete
    await createAuditLog({
      data: {
        contractId: currentRow.id,
        action: "delete",
        field: null,
        oldValue: JSON.stringify(currentRow),
        newValue: null,
        userId: session?.user?.id || null,
        userName: session?.user?.name || null,
      },
    });

    await deleteContract({
      where: { id: currentRow.id },
    });

    setOpen(null);
    setTimeout(() => {
      setCurrentRow(null);
    }, 500);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  const formatAction = (action: string) => {
    switch (action) {
      case "create":
        return "Criação";
      case "update":
        return "Atualização";
      case "delete":
        return "Exclusão";
      default:
        return action;
    }
  };

  return (
    <>
      <ContractsMutateDrawer
        key="contract-create"
        open={open === "create"}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      />

      <ContractUploadDrawer
        key="contract-upload"
        open={open === "upload"}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      />

      {currentRow && (
        <>
          <ContractsMutateDrawer
            key={`contract-update-${currentRow.id}`}
            open={open === "update"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key="contract-toggle-active"
            open={open === "toggle-active"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
            handleConfirm={handleToggleActive}
            className="max-w-md"
            title={`${currentRow.active ? "Desativar" : "Ativar"} contrato: ${currentRow.name}?`}
            desc={
              currentRow.active ? (
                <>
                  Você está prestes a desativar o contrato{" "}
                  <strong>{currentRow.name}</strong>. <br />
                  As unidades consumidoras vinculadas continuarão vinculadas,
                  mas o contrato não será considerado em cálculos de limites.
                </>
              ) : (
                <>
                  Você está prestes a ativar o contrato{" "}
                  <strong>{currentRow.name}</strong>. <br />O contrato voltará a
                  ser considerado em validações e cálculos.
                </>
              )
            }
            confirmText={currentRow.active ? "Desativar" : "Ativar"}
          />

          <ConfirmDialog
            key="contract-delete"
            destructive
            open={open === "delete"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
            handleConfirm={handleDelete}
            className="max-w-md"
            title={`Excluir contrato: ${currentRow.name}?`}
            desc={
              <>
                Você está prestes a excluir o contrato{" "}
                <strong>{currentRow.name}</strong>. <br />
                <strong className="text-destructive">
                  Esta ação é irreversível. As unidades consumidoras vinculadas
                  serão desvinculadas deste contrato.
                </strong>
              </>
            }
            confirmText="Excluir"
          />

          {/* History Dialog */}
          <Dialog
            open={open === "view-history"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
          >
            <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Histórico de Alterações - {currentRow.name}
                </DialogTitle>
                <DialogDescription>
                  Registro de todas as alterações realizadas neste contrato.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    Nenhuma alteração registrada.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Valor Anterior</TableHead>
                        <TableHead>Novo Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.userName || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatAction(log.action)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.field || "-"}
                          </TableCell>
                          <TableCell className="max-w-32 truncate text-sm">
                            {log.oldValue ? (
                              <span
                                className="cursor-help"
                                title={log.oldValue}
                              >
                                {log.oldValue.length > 30
                                  ? `${log.oldValue.substring(0, 30)}...`
                                  : log.oldValue}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="max-w-32 truncate text-sm">
                            {log.newValue ? (
                              <span
                                className="cursor-help"
                                title={log.newValue}
                              >
                                {log.newValue.length > 30
                                  ? `${log.newValue.substring(0, 30)}...`
                                  : log.newValue}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
