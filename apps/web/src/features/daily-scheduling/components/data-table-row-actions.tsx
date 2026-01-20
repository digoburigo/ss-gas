import type { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Send, Trash } from "lucide-react";

import type {
  GasContract,
  GasDailyPlan,
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

import { useDailyScheduling } from "./daily-scheduling-provider";

type DailyPlanWithRelations = GasDailyPlan & {
  unit: GasUnit & { contract: GasContract | null };
  createdByUser: User | null;
  submittedByUser: User | null;
};

interface DataTableRowActionsProps {
  row: Row<DailyPlanWithRelations>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useDailyScheduling();

  const isSubmitted = row.original.submitted;

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
        {!isSubmitted && (
          <>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original);
                setOpen("update");
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original);
                setOpen("submit-to-distributor");
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar para Distribuidora
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original);
            setOpen("delete");
          }}
          className="text-destructive focus:text-destructive"
          disabled={isSubmitted}
        >
          <Trash className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
