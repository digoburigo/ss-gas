"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Send,
  XCircle,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import type { UnitSchedulingStatus } from "./scheduling-dashboard-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { schedulingStatuses } from "../data/data";

interface ColumnActions {
  onCreateEntry: (unitId: string) => void;
  onSubmitPlan: (planId: string) => void;
  onApprovePlan: (planId: string) => void;
  onRejectPlan: (planId: string) => void;
}

export function createColumns(
  actions: ColumnActions,
): ColumnDef<UnitSchedulingStatus>[] {
  return [
    {
      accessorKey: "unitName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unidade" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.unitName}</span>
          <span className="text-muted-foreground text-xs">
            {row.original.unitCode}
          </span>
        </div>
      ),
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "contractName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contrato" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.contractName ?? "—"}
        </span>
      ),
      filterFn: (row, _id, value: string[]) => {
        if (!value || value.length === 0) return true;
        return value.includes(row.original.contractId ?? "");
      },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = schedulingStatuses.find((s) => s.value === status);
        const Icon =
          status === "scheduled"
            ? CheckCircle
            : status === "pending"
              ? CircleDashed
              : AlertTriangle;

        return (
          <Badge
            variant="outline"
            className={
              status === "scheduled"
                ? "border-green-300 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                : status === "pending"
                  ? "border-yellow-300 bg-yellow-100 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
            }
          >
            <Icon className="mr-1 h-3 w-3" />
            {statusConfig?.label ?? status}
          </Badge>
        );
      },
      filterFn: (row, _id, value: string[]) => {
        if (!value || value.length === 0) return true;
        return value.includes(row.original.status);
      },
      enableSorting: true,
    },
    {
      accessorKey: "scheduledVolume",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="QDP (m³)" />
      ),
      cell: ({ row }) => {
        const volume = row.original.scheduledVolume;
        if (volume === null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="font-mono">
            {volume.toLocaleString("pt-BR")} m³
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "workflow",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fluxo" />
      ),
      cell: ({ row }) => {
        const { planId, submitted, approved, rejectionReason } = row.original;

        if (!planId) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }

        if (approved === true) {
          return (
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Aprovado
            </Badge>
          );
        }

        if (approved === false) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Rejeitado
                  </Badge>
                </TooltipTrigger>
                {rejectionReason && (
                  <TooltipContent>
                    <p>{rejectionReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        }

        if (submitted) {
          return (
            <Badge
              variant="outline"
              className="border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            >
              <Clock className="mr-1 h-3 w-3" />
              Aguardando Aprovação
            </Badge>
          );
        }

        return (
          <Badge
            variant="outline"
            className="border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400"
          >
            <CircleDashed className="mr-1 h-3 w-3" />
            Rascunho
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "scheduledAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Programado em" />
      ),
      cell: ({ row }) => {
        const scheduledAt = row.original.scheduledAt;
        if (!scheduledAt) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="text-muted-foreground text-sm">
            {format(scheduledAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const { planId, submitted, approved, status } = row.original;
        const isScheduled = status === "scheduled";

        return (
          <div className="flex items-center justify-end gap-1">
            {/* Programar button - show when not scheduled or to edit existing */}
            <Button
              variant={isScheduled ? "ghost" : "outline"}
              size="sm"
              onClick={() => actions.onCreateEntry(row.original.unitId)}
            >
              {isScheduled ? "Editar" : "Programar"}
            </Button>

            {/* Submit button - show when plan exists, not yet submitted */}
            {planId && !submitted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.onSubmitPlan(planId)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Send className="mr-1 h-3 w-3" />
                Submeter
              </Button>
            )}

            {/* Approve/Reject buttons - show when submitted but not yet reviewed */}
            {planId && submitted && approved === null && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.onApprovePlan(planId)}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Aprovar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.onRejectPlan(planId)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Rejeitar
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];
}
