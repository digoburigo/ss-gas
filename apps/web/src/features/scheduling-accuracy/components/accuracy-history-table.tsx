import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { AlertTriangle, CheckCircle, FileText } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { DataTableColumnHeader } from "~/components/data-table/column-header";
import { DataTablePagination } from "~/components/data-table";
import { deviationCauses, getAccuracyStatus } from "../data/data";
import { useSchedulingAccuracy } from "./scheduling-accuracy-provider";

export type AccuracyRecord = {
  id: string;
  date: string;
  unitId: string;
  unitName: string;
  unitCode: string;
  contractName: string | null;
  scheduled: number;
  actual: number;
  accuracy: number;
  deviation: number;
  deviationPercent: number;
  withinTolerance: boolean;
  cause: string | null;
  causeNotes: string | null;
};

const columns: ColumnDef<AccuracyRecord>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return (
        <div className="font-medium">
          {date.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
        </div>
      );
    },
  },
  {
    accessorKey: "unitName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unidade" />
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.unitName}</div>
        <div className="text-muted-foreground text-xs">
          {row.original.unitCode}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "contractName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contrato" />
    ),
    cell: ({ row }) => {
      const contract = row.original.contractName;
      if (!contract) {
        return <span className="text-muted-foreground">-</span>;
      }
      return <div>{contract}</div>;
    },
  },
  {
    accessorKey: "scheduled",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Programado (m³)" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.scheduled.toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
        })}
      </div>
    ),
  },
  {
    accessorKey: "actual",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Realizado (m³)" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.actual.toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
        })}
      </div>
    ),
  },
  {
    accessorKey: "accuracy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Acurácia" />
    ),
    cell: ({ row }) => {
      const accuracy = row.original.accuracy;
      const status = getAccuracyStatus(accuracy);
      if (!status) {
        return <div className="font-bold">{accuracy.toFixed(1)}%</div>;
      }
      const colorClass =
        status.value === "excellent"
          ? "text-green-600 dark:text-green-400"
          : status.value === "good"
            ? "text-blue-600 dark:text-blue-400"
            : status.value === "acceptable"
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-red-600 dark:text-red-400";

      return (
        <div className={`font-bold ${colorClass}`}>{accuracy.toFixed(1)}%</div>
      );
    },
  },
  {
    accessorKey: "deviationPercent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Desvio" />
    ),
    cell: ({ row }) => {
      const deviation = row.original.deviation;
      const deviationPercent = row.original.deviationPercent;
      const withinTolerance = row.original.withinTolerance;
      const isPositive = deviation > 0;

      return (
        <div className="flex items-center gap-1">
          {withinTolerance ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <div className="flex flex-col">
            <span
              className={
                isPositive
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-blue-600 dark:text-blue-400"
              }
            >
              {isPositive ? "+" : ""}
              {deviation.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
              m³
            </span>
            <span className="text-muted-foreground text-xs">
              ({isPositive ? "+" : ""}
              {deviationPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "cause",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Causa" />
    ),
    cell: ({ row }) => {
      const cause = row.original.cause;
      if (!cause) {
        if (!row.original.withinTolerance) {
          return (
            <Badge variant="outline" className="text-amber-600">
              Pendente
            </Badge>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      }

      const causeInfo = deviationCauses.find((c) => c.value === cause);
      if (!causeInfo) {
        return <Badge variant="outline">{cause}</Badge>;
      }

      const Icon = causeInfo.icon;
      return (
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          <Badge variant="outline">{causeInfo.label}</Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { setOpen, setSelectedRecordId } = useSchedulingAccuracy();

      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRecordId(row.original.id);
            setOpen("cause-analysis");
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Analisar
        </Button>
      );
    },
  },
];

type AccuracyHistoryTableProps = {
  data: AccuracyRecord[];
  isLoading?: boolean;
};

export function AccuracyHistoryTable({
  data,
  isLoading = false,
}: AccuracyHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p>Carregando histórico de acurácia...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum registro de acurácia encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className="mt-auto" />
    </div>
  );
}
