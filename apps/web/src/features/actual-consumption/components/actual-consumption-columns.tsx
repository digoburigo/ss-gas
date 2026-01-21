import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle,
  Gauge,
  HandMetal,
} from "lucide-react";

import type {
  ConsumptionSource,
  GasContract,
  GasDailyPlan,
  GasRealConsumption,
  GasUnit,
  User,
} from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";

import { DataTableColumnHeader } from "~/components/data-table/column-header";
import { DataTableRowActions } from "./data-table-row-actions";

type RealConsumptionWithRelations = GasRealConsumption & {
  unit: GasUnit & {
    contract: GasContract | null;
    dailyPlans?: GasDailyPlan[];
  };
  createdByUser: User | null;
};

// Helper to get the scheduled value for the same date
function getScheduledValue(row: RealConsumptionWithRelations): number | null {
  const plans = row.unit.dailyPlans;
  if (!plans || plans.length === 0) return null;

  const consumptionDate = new Date(row.date).toISOString().split("T")[0];

  for (const plan of plans) {
    const planDate = new Date(plan.date).toISOString().split("T")[0];
    if (planDate === consumptionDate) {
      return plan.qdpValue;
    }
  }

  return null;
}

// Helper to calculate deviation
function calculateDeviation(
  actual: number,
  scheduled: number | null,
): { absolute: number; percent: number } | null {
  if (scheduled === null || scheduled === 0) return null;
  const absolute = actual - scheduled;
  const percent = (absolute / scheduled) * 100;
  return { absolute, percent };
}

const sourceIcons: Record<ConsumptionSource, LucideIcon> = {
  meter: Gauge,
  manual: HandMetal,
  calculated: Calculator,
};

const sourceLabels: Record<ConsumptionSource, string> = {
  meter: "Medidor",
  manual: "Manual",
  calculated: "Calculado",
};

export const columns: ColumnDef<RealConsumptionWithRelations>[] = [
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
    accessorKey: "qdrValue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Consumo Real (QDR)" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("qdrValue") as number;
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
    id: "scheduled",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Programado (QDP)" />
    ),
    cell: ({ row }) => {
      const scheduledValue = getScheduledValue(row.original);
      const contract = row.original.unit.contract;
      const unit = contract?.volumeUnit ?? "m³";

      if (scheduledValue === null) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <div>
          {scheduledValue.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
          {unit}
        </div>
      );
    },
  },
  {
    id: "deviation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Desvio" />
    ),
    cell: ({ row }) => {
      const actualValue = row.original.qdrValue;
      const scheduledValue = getScheduledValue(row.original);
      const deviation = calculateDeviation(actualValue, scheduledValue);
      const contract = row.original.unit.contract;
      const unit = contract?.volumeUnit ?? "m³";

      if (!deviation) {
        return <span className="text-muted-foreground">-</span>;
      }

      const isWithinLimit = Math.abs(deviation.percent) <= 10;
      const isPositive = deviation.absolute > 0;

      return (
        <div className="flex items-center gap-1">
          {isWithinLimit ? (
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
              {deviation.absolute.toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
              })}{" "}
              {unit}
            </span>
            <span className="text-muted-foreground text-xs">
              ({isPositive ? "+" : ""}
              {deviation.percent.toFixed(1)}%)
            </span>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const actualValue = row.original.qdrValue;
      const scheduledValue = getScheduledValue(row.original);
      const deviation = calculateDeviation(actualValue, scheduledValue);

      if (!deviation) {
        return value.includes("no_schedule");
      }

      const isWithinLimit = Math.abs(deviation.percent) <= 10;

      if (value.includes("within_limit") && isWithinLimit) return true;
      if (
        value.includes("above_limit") &&
        !isWithinLimit &&
        deviation.absolute > 0
      )
        return true;
      if (
        value.includes("below_limit") &&
        !isWithinLimit &&
        deviation.absolute < 0
      )
        return true;

      return false;
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fonte" />
    ),
    cell: ({ row }) => {
      const source = row.getValue("source") as ConsumptionSource;
      const Icon = sourceIcons[source];
      const label = sourceLabels[source];

      return (
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          <Badge variant="outline">{label}</Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
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
      <DataTableColumnHeader column={column} title="Registrado em" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      const user = row.original.createdByUser;
      return (
        <div className="text-xs">
          <div>
            {date.toLocaleDateString("pt-BR")}{" "}
            {date.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
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
