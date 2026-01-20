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
import {
  AlertTriangle,
  CheckCircle,
  Mail,
  MailCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import { DataTableColumnHeader } from "~/components/data-table/column-header";
import { DataTablePagination } from "~/components/data-table";
import { getSeverityLevel, getSeverityColorClasses } from "../data/data";
import { useDeviationAlerts } from "./deviation-alerts-provider";

export type DeviationAlert = {
  id: string;
  date: string;
  unitId: string;
  unitName: string;
  unitCode: string;
  contractName: string | null;
  scheduled: number;
  actual: number;
  deviation: number;
  deviationPercent: number;
  status: "active" | "acknowledged" | "resolved";
  emailSent: boolean;
  emailSentAt: string | null;
};

const columns: ColumnDef<DeviationAlert>[] = [
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
    accessorKey: "deviationPercent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Desvio" />
    ),
    cell: ({ row }) => {
      const deviation = row.original.deviation;
      const deviationPercent = row.original.deviationPercent;
      const isPositive = deviation > 0;
      const severity = getSeverityLevel(deviationPercent);
      const colorClasses = getSeverityColorClasses(severity?.value ?? "medium");
      const Icon = isPositive ? TrendingUp : TrendingDown;

      return (
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 rounded px-2 py-1 ${colorClasses.bg}`}
          >
            <Icon className={`h-4 w-4 ${colorClasses.text}`} />
            <div className="flex flex-col">
              <span className={`font-bold ${colorClasses.text}`}>
                {isPositive ? "+" : ""}
                {deviationPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <Badge className={colorClasses.badge}>{severity?.label}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;

      if (status === "active") {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Ativo
          </Badge>
        );
      }
      if (status === "acknowledged") {
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Reconhecido
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          Resolvido
        </Badge>
      );
    },
  },
  {
    accessorKey: "emailSent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="E-mail" />
    ),
    cell: ({ row }) => {
      const emailSent = row.original.emailSent;
      const emailSentAt = row.original.emailSentAt;

      if (emailSent && emailSentAt) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-green-600"
                >
                  <MailCheck className="h-3 w-3" />
                  Enviado
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Enviado em{" "}
                  {new Date(emailSentAt).toLocaleString("pt-BR", {
                    timeZone: "UTC",
                  })}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
          <Mail className="h-3 w-3" />
          Pendente
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { setOpen, setSelectedAlertId } = useDeviationAlerts();
      const alert = row.original;

      return (
        <div className="flex items-center gap-2">
          {!alert.emailSent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedAlertId(alert.id);
                setOpen("send-email");
              }}
            >
              <Mail className="mr-1 h-4 w-4" />
              Enviar
            </Button>
          )}
          {alert.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedAlertId(alert.id);
                setOpen("acknowledge");
              }}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Reconhecer
            </Button>
          )}
        </div>
      );
    },
  },
];

type DeviationAlertsTableProps = {
  data: DeviationAlert[];
  isLoading?: boolean;
};

export function DeviationAlertsTable({
  data,
  isLoading = false,
}: DeviationAlertsTableProps) {
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
        <p>Carregando alertas de desvio...</p>
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
              table.getRowModel().rows.map((row) => {
                const severity = getSeverityLevel(row.original.deviationPercent);
                const colorClasses = getSeverityColorClasses(
                  severity?.value ?? "medium",
                );

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={row.original.status === "active" ? colorClasses.bg : ""}
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
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum alerta de desvio encontrado no período.
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
