import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@acme/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";

import type { Member } from "../data/schema";
import { DataTableColumnHeader } from "~/components/data-table";
import { profiles, roles } from "../data/data";
import { DataTableRowActions } from "./data-table-row-actions";

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper to get status from member
function getMemberStatus(
  member: Member,
): "active" | "inactive" | "invited" | "suspended" {
  if (member.deactivatedAt) return "inactive";
  return "active";
}

const statusColors: Record<string, string> = {
  active: "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200",
  inactive: "bg-neutral-300/40 border-neutral-300",
  invited: "bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300",
  suspended:
    "bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10",
};

export const usersColumns: ColumnDef<Member>[] = [
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
    meta: {
      className: cn("start-0 z-10 rounded-tl-[inherit] max-md:sticky"),
    },
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
    accessorKey: "user",
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usuário" />
    ),
    cell: ({ row }) => {
      const member = row.original;
      const user = member.user;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    },
    meta: {
      className: cn(
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]",
        "start-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none",
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: "profile",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Perfil" />
    ),
    cell: ({ row }) => {
      const profileValue = row.getValue("profile") as string | undefined;
      const profileInfo = profiles.find(({ value }) => value === profileValue);

      if (!profileInfo) {
        return (
          <span className="text-sm text-muted-foreground">Visualizador</span>
        );
      }

      return (
        <div className="flex items-center gap-x-2">
          {profileInfo.icon && (
            <profileInfo.icon size={16} className="text-muted-foreground" />
          )}
          <span className="text-sm">{profileInfo.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: false,
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cargo" />
    ),
    cell: ({ row }) => {
      const roleValue = row.getValue("role") as string;
      const roleInfo = roles.find(({ value }) => value === roleValue);

      if (!roleInfo) {
        return <span className="text-sm capitalize">{roleValue}</span>;
      }

      return (
        <div className="flex items-center gap-x-2">
          {roleInfo.icon && (
            <roleInfo.icon size={16} className="text-muted-foreground" />
          )}
          <span className="text-sm">{roleInfo.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: false,
  },
  {
    id: "status",
    accessorFn: (row) => getMemberStatus(row),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = getMemberStatus(row.original);
      const badgeColor = statusColors[status];
      const statusLabels: Record<string, string> = {
        active: "Ativo",
        inactive: "Desativado",
        invited: "Convidado",
        suspended: "Suspenso",
      };
      return (
        <Badge variant="outline" className={cn("capitalize", badgeColor)}>
          {statusLabels[status]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(getMemberStatus(row.original));
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Adicionado em" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <span className="text-sm text-muted-foreground">
          {format(date, "dd/MM/yyyy", { locale: ptBR })}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: DataTableRowActions,
  },
];
