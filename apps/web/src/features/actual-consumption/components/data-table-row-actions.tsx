import type { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";

import type {
  GasContract,
  GasDailyPlan,
  GasRealConsumption,
  GasUnit,
  User,
} from "@acme/zen-v3/zenstack/models";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import { useActualConsumption } from "./actual-consumption-provider";

type RealConsumptionWithRelations = GasRealConsumption & {
  unit: GasUnit & {
    contract: GasContract | null;
    dailyPlans?: GasDailyPlan[];
  };
  createdByUser: User | null;
};

interface DataTableRowActionsProps {
  row: Row<RealConsumptionWithRelations>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useActualConsumption();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original);
            setOpen("update");
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original);
            setOpen("delete");
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
