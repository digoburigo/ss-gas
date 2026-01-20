"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle,
  CircleDashed,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import type { UnitSchedulingStatus } from "./scheduling-dashboard-table";
import { DataTableColumnHeader } from "~/components/data-table";
import { schedulingStatuses } from "../data/data";

export function createColumns(): ColumnDef<UnitSchedulingStatus>[] {
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
      filterFn: (row, id, value: string[]) => {
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
      filterFn: (row, id, value: string[]) => {
        if (!value || value.length === 0) return true;
        return value.includes(row.original.status);
      },
      enableSorting: true,
    },
    {
      accessorKey: "scheduledVolume",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Volume Programado" />
      ),
      cell: ({ row }) => {
        const volume = row.original.scheduledVolume;
        if (volume === null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="font-mono">{volume.toLocaleString("pt-BR")} m³</span>
        );
      },
      enableSorting: true,
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
        const isScheduled = row.original.status === "scheduled";
        return (
          <div className="flex items-center justify-end gap-2">
            {!isScheduled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/gas/scheduling";
                }}
              >
                Programar
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
