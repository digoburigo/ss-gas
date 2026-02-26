import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import type {
  GasContract,
  GasContractAlert,
  GasContractAlertRecipient,
} from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import { DataTableColumnHeader } from "~/components/data-table";
import { eventTypeOptions, recurrenceOptions } from "../data/data";
import { DataTableRowActions } from "./data-table-row-actions";

type GasContractAlertWithRelations = GasContractAlert & {
  contract?: Pick<GasContract, "id" | "name"> | null;
  recipients?: Array<Pick<GasContractAlertRecipient, "id" | "email" | "name">>;
  sentAlerts?: Array<{
    id: string;
    status: string;
    sentAt: Date;
  }>;
};

export const contractAlertsColumns: ColumnDef<GasContractAlertWithRelations>[] =
  [
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
      accessorKey: "eventName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome do Evento" />
      ),
      meta: { className: "ps-1", tdClassName: "ps-4" },
      cell: ({ row }) => {
        return (
          <span className="max-w-32 truncate font-medium sm:max-w-72 md:max-w-[31rem]">
            {row.getValue("eventName")}
          </span>
        );
      },
    },
    {
      accessorKey: "contract",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contrato" />
      ),
      cell: ({ row }) => {
        const contract = row.original.contract;
        return (
          <span className="truncate">{contract ? contract.name : "-"}</span>
        );
      },
    },
    {
      accessorKey: "eventType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      cell: ({ row }) => {
        const eventType = row.getValue<string>("eventType");
        const option = eventTypeOptions.find((opt) => opt.value === eventType);
        return (
          <span className="text-sm whitespace-nowrap">
            {option?.label ?? eventType}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "eventDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => {
        const eventDate = row.original.eventDate;
        const eventType = row.original.eventType;

        if (eventType !== "custom" && !eventDate) {
          return (
            <span className="text-muted-foreground text-sm italic">
              Do contrato
            </span>
          );
        }

        if (!eventDate) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <span className="text-sm whitespace-nowrap">
            {format(new Date(eventDate), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        );
      },
    },
    {
      accessorKey: "recurrence",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Recorrência" />
      ),
      cell: ({ row }) => {
        const recurrence = row.getValue<string>("recurrence");
        const option = recurrenceOptions.find(
          (opt) => opt.value === recurrence,
        );
        return (
          <Badge variant="outline" className="whitespace-nowrap">
            {option?.label ?? recurrence}
          </Badge>
        );
      },
    },
    {
      accessorKey: "advanceNoticeDays",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Antecedência" />
      ),
      cell: ({ row }) => {
        const days = row.original.advanceNoticeDays;
        if (!days || days.length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <span className="text-sm">
            {days.sort((a, b) => b - a).join(", ")} dias
          </span>
        );
      },
    },
    {
      accessorKey: "recipients",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Destinatários" />
      ),
      cell: ({ row }) => {
        const recipients = row.original.recipients;
        if (!recipients || recipients.length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="truncate text-sm">{recipients[0]?.email}</span>
            {recipients.length > 1 && (
              <span className="text-muted-foreground text-xs">
                +{recipients.length - 1}{" "}
                {recipients.length - 1 === 1 ? "outro" : "outros"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      meta: { className: "ps-1", tdClassName: "ps-3" },
      cell: ({ row }) => {
        const active = row.getValue<boolean>("active");
        return (
          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Ativo" : "Inativo"}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        const active = row.getValue<boolean>(id);
        return value.includes(active ? "active" : "inactive");
      },
    },
    {
      id: "delivery",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entrega" />
      ),
      cell: ({ row }) => {
        const sentAlerts = row.original.sentAlerts;
        if (!sentAlerts || sentAlerts.length === 0) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <Badge variant="outline" className="text-xs">
                      Pendente
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Nenhum email enviado ainda
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        const lastSent = sentAlerts[0]!;
        const isFailed = lastSent.status === "failed";

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  {isFailed ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <Badge
                    variant={isFailed ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {isFailed ? "Falhou" : "Enviado"}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {format(
                  new Date(lastSent.sentAt),
                  "dd/MM/yyyy 'às' HH:mm",
                  { locale: ptBR },
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    {
      id: "actions",
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ];
