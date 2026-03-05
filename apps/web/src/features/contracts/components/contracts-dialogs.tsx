import { useState } from "react";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { Check, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
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

  // Fetch contract versions for version history dialog
  const { data: contractVersions = [] } = client.gasContractVersion.useFindMany(
    {
      where: { contractId: currentRow?.id },
      orderBy: { versionNumber: "desc" },
      include: { uploadedByUser: { select: { name: true } } },
    },
    {
      enabled: open === "view-versions" && !!currentRow,
    },
  );

  const [viewingVersion, setViewingVersion] = useState<string | null>(null);

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
          {/* Re-upload drawer for versioning */}
          <ContractUploadDrawer
            key={`contract-reupload-${currentRow.id}`}
            open={open === "re-upload"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
            existingContract={currentRow}
          />

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

          {/* Version History Dialog */}
          <Dialog
            open={open === "view-versions"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setViewingVersion(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
          >
            <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Versões do Contrato - {currentRow.name}
                </DialogTitle>
                <DialogDescription>
                  Histórico de versões do contrato. A versão ativa é a que está
                  em uso atualmente.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {contractVersions.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    Nenhuma versão registrada. Faça um re-upload para criar
                    versões.
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Versão</TableHead>
                          <TableHead>Data Upload</TableHead>
                          <TableHead>Enviado por</TableHead>
                          <TableHead>Resumo</TableHead>
                          <TableHead>Arquivo</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                          <TableHead className="w-20">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contractVersions.map((version) => (
                          <TableRow key={version.id}>
                            <TableCell className="font-mono text-sm">
                              v{version.versionNumber}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatDate(version.uploadedAt)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {(
                                version as typeof version & {
                                  uploadedByUser?: { name: string } | null;
                                }
                              ).uploadedByUser?.name || "-"}
                            </TableCell>
                            <TableCell className="max-w-48 truncate text-sm">
                              {version.extractedDataSummary || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {version.fileName ? (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span className="max-w-24 truncate">
                                    {version.fileName}
                                  </span>
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {version.isActive ? (
                                <Badge
                                  variant="default"
                                  className="gap-1 bg-green-600"
                                >
                                  <Check className="h-3 w-3" />
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Anterior</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() =>
                                  setViewingVersion(
                                    viewingVersion === version.id
                                      ? null
                                      : version.id,
                                  )
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Version detail view */}
                    {viewingVersion && (
                      <VersionDetailView
                        version={contractVersions.find(
                          (v) => v.id === viewingVersion,
                        )}
                      />
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

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

const VERSION_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  contractNumber: "Numero do Contrato",
  supplier: "Fornecedor",
  supplierCnpj: "CNPJ Fornecedor",
  qdcContracted: "QDC Contratada",
  volumeUnit: "Unidade Volume",
  basePricePerUnit: "Preco Base/Unidade",
  priceCurrency: "Moeda",
  effectiveFrom: "Vigencia Inicio",
  effectiveTo: "Vigencia Fim",
  takeOrPayPercent: "Take-or-Pay %",
  flexibilityUpPercent: "Flexibilidade Cima %",
  flexibilityDownPercent: "Flexibilidade Baixo %",
  active: "Ativo",
};

function VersionDetailView({
  version,
}: {
  version?: { dataSnapshot: string } | null;
}) {
  if (!version) return null;

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(version.dataSnapshot);
  } catch {
    return (
      <p className="text-muted-foreground mt-4 text-center text-sm">
        Erro ao carregar dados da versao.
      </p>
    );
  }

  const displayFields = Object.entries(VERSION_FIELD_LABELS);

  return (
    <div className="bg-muted/30 mt-4 rounded-lg border p-4">
      <h4 className="mb-3 text-sm font-medium">Dados desta versao</h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {displayFields.map(([key, label]) => {
          const value = data[key];
          let displayValue = "-";
          if (value !== null && value !== undefined) {
            if (typeof value === "boolean") {
              displayValue = value ? "Sim" : "Nao";
            } else if (
              typeof value === "string" &&
              /^\d{4}-\d{2}-\d{2}/.test(value)
            ) {
              displayValue = new Date(value).toLocaleDateString("pt-BR");
            } else {
              displayValue = String(value);
            }
          }
          return (
            <div key={key} className="flex justify-between border-b py-1">
              <span className="text-muted-foreground text-sm">{label}</span>
              <span className="text-sm font-medium">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
