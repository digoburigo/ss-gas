import { Edit, Plus, Trash2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Separator } from "@acme/ui/separator";

import type { AuditLogEntry } from "./audit-log-table";
import { useAuditLog } from "./audit-log-provider";
import {
  getEntityTypeInfo,
  getActionTypeInfo,
  getActionColorClasses,
  formatFieldName,
  formatValue,
  isJsonValue,
} from "../data/data";

type DetailsDialogProps = {
  log: AuditLogEntry | undefined;
};

export function DetailsDialog({ log }: DetailsDialogProps) {
  const { open, setOpen } = useAuditLog();

  const isOpen = open === "details" && !!log;

  if (!log) return null;

  const entityInfo = getEntityTypeInfo(log.entityType);
  const actionInfo = getActionTypeInfo(log.action);
  const colorClasses = getActionColorClasses(log.action);
  const Icon =
    log.action === "create" ? Plus : log.action === "delete" ? Trash2 : Edit;
  const EntityIcon = entityInfo?.icon;

  // Parse changes JSON if available
  let changesObj: Record<string, { old: string; new: string }> | null = null;
  if (log.changes && isJsonValue(log.changes)) {
    try {
      changesObj = JSON.parse(log.changes);
    } catch {
      changesObj = null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setOpen(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Registro</DialogTitle>
          <DialogDescription>
            Informações completas da alteração registrada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {EntityIcon && (
                <div className="bg-muted rounded-lg p-2">
                  <EntityIcon className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-medium">{entityInfo?.label}</p>
                {log.entityName && (
                  <p className="text-muted-foreground text-sm">
                    {log.entityName}
                  </p>
                )}
              </div>
            </div>
            <Badge className={colorClasses.badge}>
              <Icon className="mr-1 h-3 w-3" />
              {actionInfo?.label}
            </Badge>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Data/Hora</p>
              <p className="font-medium">
                {new Date(log.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Usuário</p>
              <p className="font-medium">{log.userName ?? "Sistema"}</p>
              {log.userEmail && (
                <p className="text-muted-foreground text-xs">{log.userEmail}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">ID da Entidade</p>
              <p className="font-mono text-xs">{log.entityId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ID do Registro</p>
              <p className="font-mono text-xs">{log.id}</p>
            </div>
          </div>

          <Separator />

          {/* Changes */}
          {log.action === "create" && (
            <div className="text-muted-foreground text-sm">
              <p className="font-medium text-foreground mb-2">Alteração</p>
              <p className="italic">Novo registro criado no sistema.</p>
            </div>
          )}

          {log.action === "delete" && (
            <div className="text-muted-foreground text-sm">
              <p className="font-medium text-foreground mb-2">Alteração</p>
              <p className="italic">Registro removido do sistema.</p>
            </div>
          )}

          {log.action === "update" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Alteração</p>

              {/* Single field change */}
              {log.field && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-muted-foreground mb-2 text-xs uppercase">
                    Campo: {formatFieldName(log.field)}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Valor anterior:
                      </span>
                      <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-sm line-through opacity-60">
                        {formatValue(log.oldValue)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Novo valor:
                      </span>
                      <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-sm font-medium">
                        {formatValue(log.newValue)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple field changes */}
              {changesObj && Object.keys(changesObj).length > 0 && (
                <div className="max-h-64 space-y-2 overflow-auto">
                  {Object.entries(changesObj).map(([field, values]) => (
                    <div key={field} className="bg-muted rounded-lg p-3">
                      <p className="text-muted-foreground mb-1 text-xs uppercase">
                        {formatFieldName(field)}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="line-through opacity-60">
                          {formatValue(values.old)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">
                          {formatValue(values.new)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
