import type { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";

import type {
  GasContract,
  GasContractAlert,
  GasContractAlertRecipient,
} from "@acme/zen-v3/zenstack/models";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import { useContractAlerts } from "./contract-alerts-provider";

type GasContractAlertWithRelations = GasContractAlert & {
  contract?: GasContract | null;
  recipients?: GasContractAlertRecipient[];
};

interface DataTableRowActionsProps {
  row: Row<GasContractAlertWithRelations>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useContractAlerts();

  const handleEdit = () => {
    setCurrentRow(row.original);
    setOpen("update");
  };

  const handleToggleActive = () => {
    setCurrentRow(row.original);
    setOpen("toggle-active");
  };

  const handleDelete = () => {
    setCurrentRow(row.original);
    setOpen("delete");
  };

  return (
    <DropdownMenu>
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
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleActive}>
          <Power className="mr-2 h-4 w-4" />
          {row.original.active ? "Desativar" : "Ativar"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
