import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, CircleDashed, Clock, Send, XCircle } from "lucide-react";

import type {
  GasContract,
  GasDailyPlan,
  GasUnit,
  User,
} from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";

import { DataTableColumnHeader } from "~/components/data-table/column-header";
import { DataTableRowActions } from "./data-table-row-actions";

type DailyPlanWithRelations = GasDailyPlan & {
  unit: GasUnit & { contract: GasContract | null };
  createdByUser: User | null;
  submittedByUser: User | null;
};

export const columns: ColumnDef<DailyPlanWithRelations>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    accessorKey: "unit.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unidade" />
    ),
    cell: ({ row }) => {
      const unit = row.original.unit;
      return (
        <div>
          <div className="font-medium">{unit.name}</div>
          <div className="text-muted-foreground text-xs">{unit.code}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "unit.contract.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contrato" />
    ),
    cell: ({ row }) => {
      const contract = row.original.unit.contract;
      if (!contract) {
        return <span className="text-muted-foreground">Sem contrato</span>;
      }
      return <div>{contract.name}</div>;
    },
  },
  {
    accessorKey: "qdpValue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Volume Programado" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("qdpValue") as number;
      const contract = row.original.unit.contract;
      const unit = contract?.volumeUnit ?? "m³";
      return (
        <div className="font-medium">
          {value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} {unit}
        </div>
      );
    },
  },
  {
    id: "contractLimits",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Limites do Contrato" />
    ),
    cell: ({ row }) => {
      const qdpValue = row.original.qdpValue;
      const contract = row.original.unit.contract;

      if (!contract) {
        return <span className="text-muted-foreground">-</span>;
      }

      const qdc = contract.qdcContracted;
      const upperTolerance = contract.transportToleranceUpperPercent ?? 10;
      const lowerTolerance = contract.transportToleranceLowerPercent ?? 20;
      const maxAllowed = qdc * (1 + upperTolerance / 100);
      const minAllowed = qdc * (1 - lowerTolerance / 100);

      const isAboveMax = qdpValue > maxAllowed;
      const isBelowMin = qdpValue < minAllowed;

      return (
        <div className="text-xs">
          <div className="flex items-center gap-1">
            {isAboveMax && (
              <Badge variant="destructive" className="text-xs">
                Acima do máximo
              </Badge>
            )}
            {isBelowMin && (
              <Badge variant="destructive" className="text-xs">
                Abaixo do mínimo
              </Badge>
            )}
            {!isAboveMax && !isBelowMin && (
              <Badge variant="outline" className="text-xs">
                Dentro dos limites
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground mt-1">
            {minAllowed.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} -{" "}
            {maxAllowed.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}{" "}
            {contract.volumeUnit}
          </div>
        </div>
      );
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const submitted = row.original.submitted;
      const approved = row.original.approved;
      const rejectionReason = row.original.rejectionReason;

      if (!submitted) {
        return (
          <div className="flex items-center gap-2">
            <CircleDashed className="h-4 w-4 text-yellow-500" />
            <span>Pendente</span>
          </div>
        );
      }

      if (approved === true) {
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Aprovado</span>
          </div>
        );
      }

      if (approved === false) {
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Rejeitado</span>
            </div>
            {rejectionReason && (
              <span className="text-muted-foreground text-xs">
                {rejectionReason}
              </span>
            )}
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-500" />
          <span>Enviado</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const submitted = row.original.submitted;
      const approved = row.original.approved;

      if (value.includes("pending") && !submitted) return true;
      if (value.includes("submitted") && submitted && approved === null)
        return true;
      if (value.includes("approved") && approved === true) return true;
      if (value.includes("rejected") && approved === false) return true;

      return false;
    },
  },
  {
    accessorKey: "notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Observações" />
    ),
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string | null;
      if (!notes) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="max-w-[200px] truncate" title={notes}>
          {notes}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado em" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      const user = row.original.createdByUser;
      return (
        <div className="text-xs">
          <div>{date.toLocaleDateString("pt-BR")}</div>
          {user && <div className="text-muted-foreground">{user.name}</div>}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
