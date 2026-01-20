import type { Row } from "@tanstack/react-table";
import { MapPin, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import type { Member } from "../data/schema";
import { useUsers } from "./users-provider";

type DataTableRowActionsProps = {
  row: Row<Member>;
};

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentMember } = useUsers();
  const member = row.original;
  const isDeactivated = !!member.deactivatedAt;
  const isOperator = member.profile === "operator";

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
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem
          onSelect={() => {
            setCurrentMember(member);
            setOpen("edit-profile");
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar Perfil
        </DropdownMenuItem>

        {isOperator && !isDeactivated && (
          <DropdownMenuItem
            onSelect={() => {
              setCurrentMember(member);
              setOpen("assign-units");
            }}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Atribuir Unidades
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {isDeactivated ? (
          <DropdownMenuItem
            onSelect={() => {
              setCurrentMember(member);
              setOpen("reactivate");
            }}
          >
            <Power className="mr-2 h-4 w-4" />
            Reativar Usuário
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              setCurrentMember(member);
              setOpen("deactivate");
            }}
            className="text-destructive focus:text-destructive"
          >
            <PowerOff className="mr-2 h-4 w-4" />
            Desativar Usuário
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
